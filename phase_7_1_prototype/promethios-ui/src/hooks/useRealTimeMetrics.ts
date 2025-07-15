/**
 * Real-Time Metrics Hook
 * 
 * Provides real-time metrics updates with WebSocket-like behavior
 * and automatic synchronization across components.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { metricsCollectionExtension, AgentMetricsProfile } from '../extensions/MetricsCollectionExtension';

interface RealTimeMetricsState {
  profiles: Map<string, AgentMetricsProfile>;
  lastUpdate: Date;
  isConnected: boolean;
  error: string | null;
}

interface MetricsSubscription {
  agentId: string;
  version: 'test' | 'production';
  callback: (profile: AgentMetricsProfile | null) => void;
}

class RealTimeMetricsManager {
  private static instance: RealTimeMetricsManager;
  private subscriptions: Map<string, MetricsSubscription[]> = new Map();
  private profiles: Map<string, AgentMetricsProfile> = new Map();
  private updateInterval: NodeJS.Timeout | null = null;
  private isRunning = false;

  static getInstance(): RealTimeMetricsManager {
    if (!RealTimeMetricsManager.instance) {
      RealTimeMetricsManager.instance = new RealTimeMetricsManager();
    }
    return RealTimeMetricsManager.instance;
  }

  subscribe(agentId: string, version: 'test' | 'production', callback: (profile: AgentMetricsProfile | null) => void): () => void {
    const key = `${agentId}_${version}`;
    
    if (!this.subscriptions.has(key)) {
      this.subscriptions.set(key, []);
    }
    
    const subscription: MetricsSubscription = { agentId, version, callback };
    this.subscriptions.get(key)!.push(subscription);
    
    // Start the update loop if not already running
    this.startUpdateLoop();
    
    // Immediately fetch and send current data
    this.fetchAndNotify(agentId, version);
    
    // Return unsubscribe function
    return () => {
      const subs = this.subscriptions.get(key);
      if (subs) {
        const index = subs.indexOf(subscription);
        if (index > -1) {
          subs.splice(index, 1);
        }
        
        // Clean up empty subscription arrays
        if (subs.length === 0) {
          this.subscriptions.delete(key);
        }
      }
      
      // Stop update loop if no more subscriptions
      if (this.subscriptions.size === 0) {
        this.stopUpdateLoop();
      }
    };
  }

  private async fetchAndNotify(agentId: string, version: 'test' | 'production'): Promise<void> {
    try {
      const profile = await metricsCollectionExtension.getAgentMetricsProfile(agentId, version);
      const key = `${agentId}_${version}`;
      
      // Store the profile
      this.profiles.set(key, profile);
      
      // Notify all subscribers for this agent/version
      const subscribers = this.subscriptions.get(key) || [];
      subscribers.forEach(sub => {
        try {
          sub.callback(profile);
        } catch (error) {
          console.error('Error in metrics subscription callback:', error);
        }
      });
      
    } catch (error) {
      console.error(`Failed to fetch metrics for ${agentId} (${version}):`, error);
      
      // Notify subscribers of the error
      const key = `${agentId}_${version}`;
      const subscribers = this.subscriptions.get(key) || [];
      subscribers.forEach(sub => {
        try {
          sub.callback(null);
        } catch (callbackError) {
          console.error('Error in metrics subscription error callback:', callbackError);
        }
      });
    }
  }

  private startUpdateLoop(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.updateInterval = setInterval(() => {
      this.updateAllSubscriptions();
    }, 30000); // Update every 30 seconds
    
    console.log('🔄 Real-time metrics update loop started');
  }

  private stopUpdateLoop(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    this.isRunning = false;
    console.log('⏹️ Real-time metrics update loop stopped');
  }

  private async updateAllSubscriptions(): Promise<void> {
    const uniqueAgents = new Set<string>();
    
    // Collect all unique agent/version combinations
    for (const [key, subs] of this.subscriptions.entries()) {
      if (subs.length > 0) {
        uniqueAgents.add(key);
      }
    }
    
    // Fetch updates for all subscribed agents
    const updatePromises = Array.from(uniqueAgents).map(key => {
      const [agentId, version] = key.split('_');
      return this.fetchAndNotify(agentId, version as 'test' | 'production');
    });
    
    await Promise.allSettled(updatePromises);
  }

  // Force refresh for a specific agent
  async refreshAgent(agentId: string, version: 'test' | 'production'): Promise<void> {
    await this.fetchAndNotify(agentId, version);
  }

  // Get cached profile without triggering fetch
  getCachedProfile(agentId: string, version: 'test' | 'production'): AgentMetricsProfile | null {
    const key = `${agentId}_${version}`;
    return this.profiles.get(key) || null;
  }
}

// Hook for real-time metrics
export const useRealTimeMetrics = (agentId: string, version: 'test' | 'production' = 'test') => {
  const [profile, setProfile] = useState<AgentMetricsProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const managerRef = useRef<RealTimeMetricsManager>();

  // Initialize manager
  useEffect(() => {
    managerRef.current = RealTimeMetricsManager.getInstance();
  }, []);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!agentId || !managerRef.current) return;

    setIsLoading(true);
    setError(null);

    const unsubscribe = managerRef.current.subscribe(agentId, version, (newProfile) => {
      if (newProfile) {
        setProfile(newProfile);
        setError(null);
        setLastUpdate(new Date());
      } else {
        setError('Failed to load metrics');
      }
      setIsLoading(false);
    });

    return unsubscribe;
  }, [agentId, version]);

  // Manual refresh function
  const refresh = useCallback(async () => {
    if (!agentId || !managerRef.current) return;
    
    setIsLoading(true);
    await managerRef.current.refreshAgent(agentId, version);
  }, [agentId, version]);

  // Computed metrics values
  const trustScore = profile?.metrics.governanceMetrics.trustScore || 0;
  const complianceRate = profile?.metrics.governanceMetrics.complianceRate || 0;
  const responseTime = profile?.metrics.performanceMetrics.averageResponseTime || 0;
  const sessionIntegrity = profile?.metrics.governanceMetrics.sessionIntegrity || 0;
  const totalInteractions = profile?.metrics.governanceMetrics.totalInteractions || 0;
  const totalViolations = profile?.metrics.governanceMetrics.totalViolations || 0;

  return {
    // Profile data
    profile,
    isLoading,
    error,
    lastUpdate,
    
    // Computed metrics
    trustScore,
    complianceRate,
    responseTime,
    sessionIntegrity,
    totalInteractions,
    totalViolations,
    
    // Actions
    refresh,
    
    // Status
    isInitialized: !isLoading && !error && profile !== null
  };
};

// Hook for multiple agents real-time metrics
export const useMultiAgentRealTimeMetrics = (agents: Array<{ agentId: string; version: 'test' | 'production' }>) => {
  const [profiles, setProfiles] = useState<Map<string, AgentMetricsProfile>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [errors, setErrors] = useState<Map<string, string>>(new Map());
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const managerRef = useRef<RealTimeMetricsManager>();

  // Initialize manager
  useEffect(() => {
    managerRef.current = RealTimeMetricsManager.getInstance();
  }, []);

  // Subscribe to all agents
  useEffect(() => {
    if (!agents.length || !managerRef.current) return;

    const unsubscribeFunctions: (() => void)[] = [];
    const newProfiles = new Map<string, AgentMetricsProfile>();
    const newErrors = new Map<string, string>();
    let loadingCount = agents.length;

    agents.forEach(({ agentId, version }) => {
      const key = `${agentId}_${version}`;
      
      const unsubscribe = managerRef.current!.subscribe(agentId, version, (profile) => {
        if (profile) {
          newProfiles.set(key, profile);
          newErrors.delete(key);
        } else {
          newErrors.set(key, 'Failed to load metrics');
        }
        
        loadingCount--;
        if (loadingCount <= 0) {
          setProfiles(new Map(newProfiles));
          setErrors(new Map(newErrors));
          setIsLoading(false);
          setLastUpdate(new Date());
        }
      });
      
      unsubscribeFunctions.push(unsubscribe);
    });

    return () => {
      unsubscribeFunctions.forEach(unsub => unsub());
    };
  }, [agents]);

  // Get profile for specific agent
  const getProfile = useCallback((agentId: string, version: 'test' | 'production' = 'test'): AgentMetricsProfile | null => {
    const key = `${agentId}_${version}`;
    return profiles.get(key) || null;
  }, [profiles]);

  // Get error for specific agent
  const getError = useCallback((agentId: string, version: 'test' | 'production' = 'test'): string | null => {
    const key = `${agentId}_${version}`;
    return errors.get(key) || null;
  }, [errors]);

  return {
    profiles,
    isLoading,
    errors,
    lastUpdate,
    getProfile,
    getError,
    isInitialized: !isLoading
  };
};

export default useRealTimeMetrics;

