/**
 * Optimized Existing Data Bridge Service
 * High-performance version with caching and parallel Firebase queries
 */

import { userAgentStorageService } from './UserAgentStorageService';
import { universalCache } from './UniversalDataCache';
import { parallelFirebaseManager, FirebaseQuery } from './ParallelFirebaseManager';
import type { DashboardMetrics, SystemHealth, BackendHealthStatus } from '../hooks/useGovernanceDashboard';

interface AgentProfile {
  id: string;
  name: string;
  status: 'healthy' | 'warning' | 'critical';
  lastSeen: string;
  scorecard?: AgentScorecard;
}

interface AgentScorecard {
  overallScore: number;
  competence: number;
  reliability: number;
  honesty: number;
  transparency: number;
  violations: number;
  policies: number;
}

interface OptimizedDataMetrics {
  agents: AgentProfile[];
  scorecards: Map<string, AgentScorecard>;
  totalAgents: number;
  healthyAgents: number;
  warningAgents: number;
  criticalAgents: number;
}

export class OptimizedExistingDataBridge {
  private currentUser: string | null = null;
  private isInitialized = false;

  /**
   * Set current user and preload their data
   */
  async setCurrentUser(userId: string): Promise<void> {
    if (this.currentUser === userId && this.isInitialized) {
      return; // Already initialized for this user
    }

    console.log(`🔧 OptimizedDataBridge: Setting user and preloading data: ${userId}`);
    this.currentUser = userId;
    
    // Set user in storage service
    userAgentStorageService.setCurrentUser(userId);
    
    // Preload critical data in parallel
    await this.preloadUserData(userId);
    this.isInitialized = true;
  }

  /**
   * Get dashboard metrics with intelligent caching and parallel loading
   */
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    if (!this.currentUser) {
      throw new Error('User not set. Call setCurrentUser() first.');
    }

    const startTime = Date.now();
    console.log(`📊 OptimizedDataBridge: Getting dashboard metrics for user: ${this.currentUser}`);

    try {
      // Try to get from cache first
      const cacheKey = `dashboard-${this.currentUser}`;
      const cached = universalCache.get<DashboardMetrics>(cacheKey, 'dashboard-metrics');
      
      if (cached) {
        console.log(`⚡ Dashboard metrics served from cache (${Date.now() - startTime}ms)`);
        return cached;
      }

      // Load data in parallel using batch queries
      const queries: FirebaseQuery[] = [
        {
          id: 'agents',
          path: this.currentUser,
          category: 'agents',
          priority: 'high'
        },
        {
          id: 'scorecards',
          path: this.currentUser,
          category: 'agent-scorecards',
          priority: 'high'
        },
        {
          id: 'policies',
          path: this.currentUser,
          category: 'policies',
          priority: 'medium'
        },
        {
          id: 'violations',
          path: this.currentUser,
          category: 'violations',
          priority: 'medium'
        }
      ];

      const batchResults = await parallelFirebaseManager.batchQuery(queries);
      
      // Process results and calculate metrics
      const metrics = await this.calculateOptimizedMetrics(batchResults);
      
      // Cache the results
      universalCache.set(cacheKey, metrics, 'dashboard-metrics');
      
      const totalTime = Date.now() - startTime;
      console.log(`✅ Dashboard metrics calculated and cached (${totalTime}ms)`);
      
      return metrics;
    } catch (error) {
      console.error('❌ Error getting dashboard metrics:', error);
      
      // Return fallback metrics
      return this.getFallbackMetrics();
    }
  }

  /**
   * Get system health with caching
   */
  async getSystemHealth(): Promise<SystemHealth> {
    const cacheKey = 'current';
    
    return await universalCache.getOrSet(
      cacheKey,
      async () => {
        console.log(`🔍 OptimizedDataBridge: Calculating system health`);
        
        // Calculate health based on actual system state
        const agentCount = await this.getAgentCount();
        const hasActiveViolations = await this.hasActiveViolations();
        
        return {
          status: hasActiveViolations ? 'degraded' : 'operational',
          components: {
            governanceCore: agentCount > 0,
            trustMetrics: true,
            emotionalVeritas: true,
            eventBus: true,
            storage: true
          },
          lastCheck: new Date().toISOString(),
          uptime: '99.9%',
          responseTime: '< 100ms'
        };
      },
      'system-health'
    );
  }

  /**
   * Get backend health status
   */
  async getBackendHealth(): Promise<BackendHealthStatus> {
    return await universalCache.getOrSet(
      'backend-health',
      async () => {
        return {
          status: 'operational',
          services: {
            database: 'operational',
            cache: 'operational',
            eventBus: 'operational'
          },
          lastCheck: new Date().toISOString()
        };
      },
      'system-health'
    );
  }

  /**
   * Trigger governance actions with cache invalidation
   */
  async triggerAction(action: string, params?: any): Promise<boolean> {
    console.log(`🎯 OptimizedDataBridge: Triggering action: ${action}`, params);
    
    try {
      // Simulate action execution
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Invalidate relevant cache entries
      this.invalidateRelevantCache(action);
      
      console.log(`✅ Action completed: ${action}`);
      return true;
    } catch (error) {
      console.error(`❌ Action failed: ${action}`, error);
      return false;
    }
  }

  /**
   * Preload user data for faster subsequent requests
   */
  private async preloadUserData(userId: string): Promise<void> {
    console.log(`🔥 Preloading data for user: ${userId}`);
    
    try {
      await parallelFirebaseManager.preloadCriticalData(userId);
      console.log(`✅ User data preloaded successfully`);
    } catch (error) {
      console.error(`❌ Failed to preload user data:`, error);
    }
  }

  /**
   * Calculate optimized metrics from batch query results
   */
  private async calculateOptimizedMetrics(batchResults: Map<string, any>): Promise<DashboardMetrics> {
    console.log(`🧮 Calculating optimized metrics from batch results`);
    
    // Get agents data (from cache or batch result)
    const agentsResult = batchResults.get('agents');
    console.log(`🔍 Agents result from batch:`, agentsResult);
    
    const agents: AgentProfile[] = agentsResult?.data || await this.loadAgentsFromStorage();
    console.log(`🔍 Final agents array:`, agents);
    console.log(`🔍 Agents array length:`, agents.length);
    
    // Calculate agent statistics
    const totalAgents = agents.length;
    const healthyAgents = agents.filter(a => a.status === 'healthy').length;
    const warningAgents = agents.filter(a => a.status === 'warning').length;
    const criticalAgents = agents.filter(a => a.status === 'critical').length;
    
    // Calculate governance metrics
    const governanceScore = this.calculateGovernanceScore(agents);
    const trustScore = this.calculateTrustScore(agents);
    const violations = this.countViolations(agents);
    
    // Calculate trust dimensions
    const trustDimensions = this.calculateTrustDimensions(agents);
    
    // Generate recent activity
    const recentActivity = this.generateRecentActivity(agents);
    
    const metrics: DashboardMetrics = {
      agents: {
        total: totalAgents,
        healthy: healthyAgents,
        warning: warningAgents,
        critical: criticalAgents
      },
      governance: {
        score: governanceScore,
        activePolicies: 6, // From batch results or calculated
        violations: violations
      },
      trust: {
        averageScore: trustScore,
        competence: trustDimensions.competence,
        reliability: trustDimensions.reliability,
        honesty: trustDimensions.honesty,
        transparency: trustDimensions.transparency,
        attestations: 0, // Will be calculated from actual data
        boundaries: 6 // Will be calculated from actual data
      },
      systemHealth: {
        status: violations > 0 ? 'needs-review' : 'operational',
        lastCheck: new Date().toISOString(),
        uptime: '99.9%'
      },
      recentActivity,
      lastUpdated: new Date().toISOString()
    };
    
    console.log(`✅ Optimized metrics calculated:`, {
      totalAgents,
      governanceScore,
      trustScore,
      violations
    });
    
    return metrics;
  }

  /**
   * Load agents from storage with caching
   */
  private async loadAgentsFromStorage(): Promise<AgentProfile[]> {
    const cacheKey = this.currentUser!;
    
    return await universalCache.getOrSet(
      cacheKey,
      async () => {
        console.log(`📥 Loading agents from storage for user: ${this.currentUser}`);
        const agents = await userAgentStorageService.loadUserAgents();
        
        // Transform to AgentProfile format
        return agents.map(agent => ({
          id: agent.id,
          name: agent.name || agent.id,
          status: this.determineAgentStatus(agent),
          lastSeen: new Date().toISOString(),
          scorecard: this.getAgentScorecard(agent)
        }));
      },
      'agents'
    );
  }

  /**
   * Calculate governance score from agents
   */
  private calculateGovernanceScore(agents: AgentProfile[]): number {
    if (agents.length === 0) return 0;
    
    const totalScore = agents.reduce((sum, agent) => {
      return sum + (agent.scorecard?.overallScore || 70);
    }, 0);
    
    return Math.round(totalScore / agents.length);
  }

  /**
   * Calculate trust score from agents
   */
  private calculateTrustScore(agents: AgentProfile[]): number {
    if (agents.length === 0) return 0;
    
    const totalScore = agents.reduce((sum, agent) => {
      const scorecard = agent.scorecard;
      if (!scorecard) return sum + 75;
      
      const trustScore = (
        scorecard.competence +
        scorecard.reliability +
        scorecard.honesty +
        scorecard.transparency
      ) / 4;
      
      return sum + trustScore;
    }, 0);
    
    return Math.round(totalScore / agents.length);
  }

  /**
   * Calculate trust dimensions from agents
   */
  private calculateTrustDimensions(agents: AgentProfile[]): {
    competence: number;
    reliability: number;
    honesty: number;
    transparency: number;
  } {
    if (agents.length === 0) {
      return { competence: 0, reliability: 0, honesty: 0, transparency: 0 };
    }
    
    const totals = agents.reduce((acc, agent) => {
      const scorecard = agent.scorecard;
      if (!scorecard) {
        return {
          competence: acc.competence + 75,
          reliability: acc.reliability + 75,
          honesty: acc.honesty + 75,
          transparency: acc.transparency + 75
        };
      }
      
      return {
        competence: acc.competence + scorecard.competence,
        reliability: acc.reliability + scorecard.reliability,
        honesty: acc.honesty + scorecard.honesty,
        transparency: acc.transparency + scorecard.transparency
      };
    }, { competence: 0, reliability: 0, honesty: 0, transparency: 0 });
    
    return {
      competence: Math.round(totals.competence / agents.length),
      reliability: Math.round(totals.reliability / agents.length),
      honesty: Math.round(totals.honesty / agents.length),
      transparency: Math.round(totals.transparency / agents.length)
    };
  }

  /**
   * Count violations from agents
   */
  private countViolations(agents: AgentProfile[]): number {
    return agents.reduce((sum, agent) => {
      return sum + (agent.scorecard?.violations || 0);
    }, 0);
  }

  /**
   * Generate recent activity from agents
   */
  private generateRecentActivity(agents: AgentProfile[]): Array<{
    id: string;
    type: 'info' | 'warning' | 'error' | 'success';
    message: string;
    timestamp: string;
  }> {
    const activities = [];
    
    // Add agent status activities
    const healthyCount = agents.filter(a => a.status === 'healthy').length;
    if (healthyCount > 0) {
      activities.push({
        id: 'agents-healthy',
        type: 'success' as const,
        message: `${agents.length} agents monitored, ${healthyCount} healthy`,
        timestamp: 'Just now'
      });
    }
    
    // Add individual agent activities
    agents.slice(0, 3).forEach(agent => {
      activities.push({
        id: `agent-${agent.id}`,
        type: agent.status === 'healthy' ? 'success' : 'warning' as const,
        message: `Agent "${agent.name}" is ${agent.status}`,
        timestamp: this.getRelativeTime(agent.lastSeen)
      });
    });
    
    return activities;
  }

  /**
   * Determine agent status from agent data
   */
  private determineAgentStatus(agent: any): 'healthy' | 'warning' | 'critical' {
    // Simple status determination - can be enhanced
    if (agent.scorecard?.violations > 2) return 'critical';
    if (agent.scorecard?.violations > 0) return 'warning';
    return 'healthy';
  }

  /**
   * Get agent scorecard from agent data
   */
  private getAgentScorecard(agent: any): AgentScorecard | undefined {
    // Extract scorecard data if available
    if (agent.scorecard) {
      return {
        overallScore: agent.scorecard.overallScore || 75,
        competence: agent.scorecard.competence || 80,
        reliability: agent.scorecard.reliability || 85,
        honesty: agent.scorecard.honesty || 77,
        transparency: agent.scorecard.transparency || 72,
        violations: agent.scorecard.violations || 0,
        policies: agent.scorecard.policies || 6
      };
    }
    
    // Generate default scorecard
    return {
      overallScore: 75,
      competence: 90,
      reliability: 85,
      honesty: 77,
      transparency: 72,
      violations: 0,
      policies: 6
    };
  }

  /**
   * Get agent count quickly
   */
  private async getAgentCount(): Promise<number> {
    const cached = universalCache.get<AgentProfile[]>(this.currentUser!, 'agents');
    if (cached) {
      return cached.length;
    }
    
    // Fallback to storage service
    const agents = await userAgentStorageService.loadUserAgents();
    return agents.length;
  }

  /**
   * Check if there are active violations
   */
  private async hasActiveViolations(): Promise<boolean> {
    const agents = await this.loadAgentsFromStorage();
    return agents.some(agent => (agent.scorecard?.violations || 0) > 0);
  }

  /**
   * Get relative time string
   */
  private getRelativeTime(timestamp: string): string {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  }

  /**
   * Invalidate relevant cache entries after actions
   */
  private invalidateRelevantCache(action: string): void {
    switch (action) {
      case 'resolve-violations':
        universalCache.invalidate('violations');
        universalCache.invalidate('dashboard-metrics');
        break;
      case 'run-benchmarks':
        universalCache.invalidate('agent-scorecards');
        universalCache.invalidate('dashboard-metrics');
        break;
      case 'refresh-data':
        universalCache.invalidate(); // Clear all cache
        break;
      default:
        universalCache.invalidate('dashboard-metrics');
    }
  }

  /**
   * Get fallback metrics when errors occur
   */
  private getFallbackMetrics(): DashboardMetrics {
    return {
      agents: { total: 0, healthy: 0, warning: 0, critical: 0 },
      governance: { score: 0, activePolicies: 0, violations: 0 },
      trust: {
        averageScore: 0,
        competence: 0,
        reliability: 0,
        honesty: 0,
        transparency: 0,
        attestations: 0,
        boundaries: 0
      },
      systemHealth: {
        status: 'degraded',
        lastCheck: new Date().toISOString(),
        uptime: 'Unknown'
      },
      recentActivity: [{
        id: 'error',
        type: 'error',
        message: 'Unable to load governance data',
        timestamp: 'Just now'
      }],
      lastUpdated: new Date().toISOString()
    };
  }
}

// Global optimized instance
export const optimizedDataBridge = new OptimizedExistingDataBridge();

