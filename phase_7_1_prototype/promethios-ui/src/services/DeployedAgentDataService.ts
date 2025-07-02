/**
 * Deployed Agent Data Service
 * 
 * Manages data collection, processing, and storage for deployed agents.
 * Integrates with the deployed agent API and provides data to the governance dashboard.
 * NO MOCK DATA - returns empty states when no real data is available.
 */

import { deployedAgentAPI, DeployedAgentStatus, AgentMetrics, PolicyViolation, AgentLogEntry } from './api/deployedAgentAPI';
import { UnifiedStorageService } from './UnifiedStorageService';
import { metricsService } from './MetricsCollectionService';

export interface ProcessedAgentMetrics {
  agentId: string;
  governanceIdentity: string;
  trustScore: number;
  complianceRate: number;
  violationCount: number;
  lastActivity: string;
  status: 'active' | 'inactive' | 'error' | 'suspended';
  dataFreshness: 'live' | 'recent' | 'stale' | 'offline';
  metricsHealth: 'healthy' | 'degraded' | 'offline';
}

export interface GovernanceOverviewMetrics {
  overallScore: number;
  trustScore: number;
  complianceRate: number;
  violationCount: number;
  criticalViolations: number;
  agentCount: number;
  governedAgents: number;
  lastUpdated: string;
  dataSource: 'deployed_agents' | 'no_data';
}

export interface AgentLogQuery {
  agentId: string;
  startTime?: string;
  endTime?: string;
  level?: 'debug' | 'info' | 'warn' | 'error';
  category?: 'system' | 'governance' | 'user_interaction' | 'error';
  governanceEventsOnly?: boolean;
  limit?: number;
  offset?: number;
}

export interface LogQueryResult {
  logs: AgentLogEntry[];
  totalCount: number;
  hasMore: boolean;
  query: AgentLogQuery;
  executedAt: string;
}

/**
 * Service for managing deployed agent data
 */
export class DeployedAgentDataService {
  private storage: UnifiedStorageService;
  private dataCache: Map<string, any> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private readonly CACHE_TTL = 30 * 1000; // 30 seconds

  constructor(storage: UnifiedStorageService) {
    this.storage = storage;
  }

  /**
   * Get governance overview metrics from deployed agents
   * Returns empty state if no deployed agents exist
   */
  async getGovernanceOverviewMetrics(userId: string): Promise<GovernanceOverviewMetrics> {
    try {
      // Get deployed agents for user
      const deployedAgents = await deployedAgentAPI.getUserDeployedAgents(userId);
      
      if (deployedAgents.length === 0) {
        return this.getEmptyGovernanceMetrics();
      }

      // Calculate metrics from real deployed agent data
      const totalAgents = deployedAgents.length;
      const activeAgents = deployedAgents.filter(agent => agent.status === 'active').length;
      
      // Calculate average trust score
      const avgTrustScore = deployedAgents.reduce((sum, agent) => sum + agent.trustScore, 0) / totalAgents;
      
      // Calculate total violations
      const totalViolations = deployedAgents.reduce((sum, agent) => sum + agent.violationsToday, 0);
      
      // Calculate compliance rate (agents with 0 violations today)
      const compliantAgents = deployedAgents.filter(agent => agent.violationsToday === 0).length;
      const complianceRate = (compliantAgents / totalAgents) * 100;
      
      // Calculate overall score (weighted average of trust and compliance)
      const overallScore = Math.round((avgTrustScore * 0.6) + (complianceRate * 0.4));
      
      // Count critical violations (would need to be tracked separately)
      const criticalViolations = 0; // TODO: Implement critical violation tracking
      
      return {
        overallScore,
        trustScore: Math.round(avgTrustScore),
        complianceRate: Math.round(complianceRate),
        violationCount: totalViolations,
        criticalViolations,
        agentCount: totalAgents,
        governedAgents: activeAgents,
        lastUpdated: new Date().toISOString(),
        dataSource: 'deployed_agents'
      };

    } catch (error) {
      console.error('Failed to get governance overview metrics:', error);
      return this.getEmptyGovernanceMetrics();
    }
  }

  /**
   * Get processed metrics for individual agents
   */
  async getAgentMetrics(userId: string): Promise<ProcessedAgentMetrics[]> {
    try {
      const deployedAgents = await deployedAgentAPI.getUserDeployedAgents(userId);
      
      if (deployedAgents.length === 0) {
        return [];
      }

      return deployedAgents.map(agent => this.processAgentMetrics(agent));

    } catch (error) {
      console.error('Failed to get agent metrics:', error);
      return [];
    }
  }

  /**
   * Get metrics for a specific agent
   */
  async getAgentMetricsById(agentId: string, userId: string): Promise<ProcessedAgentMetrics | null> {
    try {
      const agentStatus = await deployedAgentAPI.getAgentStatus(agentId, userId);
      return this.processAgentMetrics(agentStatus);

    } catch (error) {
      console.error(`Failed to get metrics for agent ${agentId}:`, error);
      return null;
    }
  }

  /**
   * Query logs for a specific agent
   */
  async queryAgentLogs(query: AgentLogQuery, userId: string): Promise<LogQueryResult> {
    try {
      // Verify user owns the agent
      const agentStatus = await deployedAgentAPI.getAgentStatus(query.agentId, userId);
      if (!agentStatus) {
        throw new Error('Agent not found or access denied');
      }

      // Query logs from storage
      const logs = await this.storage.query('agent_logs', {
        agentId: query.agentId,
        startTime: query.startTime,
        endTime: query.endTime,
        level: query.level,
        category: query.category,
        governanceEventsOnly: query.governanceEventsOnly,
        limit: query.limit || 100,
        offset: query.offset || 0
      });

      // Log the access for transparency
      await this.logUserAccess(userId, query.agentId, 'log_query', query);

      return {
        logs: logs.items || [],
        totalCount: logs.totalCount || 0,
        hasMore: logs.hasMore || false,
        query,
        executedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('Failed to query agent logs:', error);
      return {
        logs: [],
        totalCount: 0,
        hasMore: false,
        query,
        executedAt: new Date().toISOString()
      };
    }
  }

  /**
   * Process incoming metrics from deployed agent
   */
  async processIncomingMetrics(metrics: AgentMetrics, apiKey: string): Promise<void> {
    try {
      // Validate API key
      const agentId = deployedAgentAPI.constructor.extractAgentIdFromAPIKey(apiKey);
      if (!agentId || agentId !== metrics.agentId) {
        throw new Error('Invalid API key for agent');
      }

      // Store metrics
      await this.storage.set('agent_metrics', `${metrics.agentId}_${Date.now()}`, {
        ...metrics,
        processedAt: new Date().toISOString()
      });

      // Update real-time cache
      this.updateCache(`metrics_${metrics.agentId}`, metrics);

      // Check for alerts
      await this.checkMetricsForAlerts(metrics);

      // Log the data processing for transparency
      await this.logDataProcessing(metrics.agentId, 'metrics_processed', {
        trustScore: metrics.metrics.trustScore,
        violations: metrics.metrics.violationsCount,
        timestamp: metrics.timestamp
      });

    } catch (error) {
      console.error('Failed to process incoming metrics:', error);
      throw error;
    }
  }

  /**
   * Process incoming violation from deployed agent
   */
  async processIncomingViolation(violation: PolicyViolation, apiKey: string): Promise<void> {
    try {
      // Validate API key
      const agentId = deployedAgentAPI.constructor.extractAgentIdFromAPIKey(apiKey);
      if (!agentId || agentId !== violation.agentId) {
        throw new Error('Invalid API key for agent');
      }

      // Store violation
      await this.storage.set('policy_violations', `${violation.agentId}_${Date.now()}`, {
        ...violation,
        processedAt: new Date().toISOString()
      });

      // Update violation count in cache
      await this.updateViolationCount(violation.agentId);

      // Generate alerts for critical violations
      if (violation.violation.severity === 'critical') {
        await this.generateCriticalViolationAlert(violation);
      }

      // Log the violation processing
      await this.logDataProcessing(violation.agentId, 'violation_processed', {
        type: violation.violation.type,
        severity: violation.violation.severity,
        timestamp: violation.timestamp
      });

    } catch (error) {
      console.error('Failed to process incoming violation:', error);
      throw error;
    }
  }

  /**
   * Process incoming log entry from deployed agent
   */
  async processIncomingLog(logEntry: AgentLogEntry, apiKey: string): Promise<void> {
    try {
      // Validate API key
      const agentId = deployedAgentAPI.constructor.extractAgentIdFromAPIKey(apiKey);
      if (!agentId || agentId !== logEntry.agentId) {
        throw new Error('Invalid API key for agent');
      }

      // Store log entry
      await this.storage.set('agent_logs', `${logEntry.agentId}_${Date.now()}`, {
        ...logEntry,
        processedAt: new Date().toISOString()
      });

      // Update log stream for real-time viewing
      await this.updateLogStream(logEntry);

      // Process governance events
      if (logEntry.governanceEvent) {
        await this.processGovernanceLogEvent(logEntry);
      }

    } catch (error) {
      console.error('Failed to process incoming log:', error);
      throw error;
    }
  }

  /**
   * Get data freshness indicator
   */
  getDataFreshness(lastUpdate: string): 'live' | 'recent' | 'stale' | 'offline' {
    const now = Date.now();
    const lastUpdateTime = new Date(lastUpdate).getTime();
    const ageMinutes = (now - lastUpdateTime) / (1000 * 60);

    if (ageMinutes <= 1) return 'live';
    if (ageMinutes <= 5) return 'recent';
    if (ageMinutes <= 30) return 'stale';
    return 'offline';
  }

  /**
   * Private helper methods
   */
  private getEmptyGovernanceMetrics(): GovernanceOverviewMetrics {
    return {
      overallScore: 0,
      trustScore: 0,
      complianceRate: 100, // 100% compliance when no agents to violate
      violationCount: 0,
      criticalViolations: 0,
      agentCount: 0,
      governedAgents: 0,
      lastUpdated: new Date().toISOString(),
      dataSource: 'no_data'
    };
  }

  private processAgentMetrics(agentStatus: DeployedAgentStatus): ProcessedAgentMetrics {
    const dataFreshness = this.getDataFreshness(agentStatus.lastHeartbeat);
    
    // Calculate compliance rate based on violations
    const complianceRate = agentStatus.violationsToday === 0 ? 100 : 
      Math.max(0, 100 - (agentStatus.violationsToday * 10));

    return {
      agentId: agentStatus.agentId,
      governanceIdentity: agentStatus.governanceIdentity,
      trustScore: agentStatus.trustScore,
      complianceRate,
      violationCount: agentStatus.violationsToday,
      lastActivity: agentStatus.lastHeartbeat,
      status: agentStatus.status,
      dataFreshness,
      metricsHealth: agentStatus.metricsHealth
    };
  }

  private updateCache(key: string, data: any): void {
    this.dataCache.set(key, data);
    this.cacheExpiry.set(key, Date.now() + this.CACHE_TTL);
  }

  private getCachedData(key: string): any | null {
    const expiry = this.cacheExpiry.get(key);
    if (!expiry || Date.now() > expiry) {
      this.dataCache.delete(key);
      this.cacheExpiry.delete(key);
      return null;
    }
    return this.dataCache.get(key) || null;
  }

  private async checkMetricsForAlerts(metrics: AgentMetrics): Promise<void> {
    // Check for low trust score
    if (metrics.metrics.trustScore < 70) {
      await this.generateAlert('low_trust_score', metrics.agentId, {
        trustScore: metrics.metrics.trustScore,
        threshold: 70
      });
    }

    // Check for high violation count
    if (metrics.metrics.violationsCount > 5) {
      await this.generateAlert('high_violation_count', metrics.agentId, {
        violationCount: metrics.metrics.violationsCount,
        threshold: 5
      });
    }
  }

  private async generateAlert(type: string, agentId: string, context: any): Promise<void> {
    // This would integrate with your notification system
    console.log(`Alert generated: ${type} for agent ${agentId}`, context);
  }

  private async generateCriticalViolationAlert(violation: PolicyViolation): Promise<void> {
    // Generate immediate alert for critical violations
    await this.generateAlert('critical_violation', violation.agentId, {
      violationType: violation.violation.type,
      description: violation.violation.description
    });
  }

  private async updateViolationCount(agentId: string): Promise<void> {
    // Update cached violation count
    const cacheKey = `violations_${agentId}`;
    const current = this.getCachedData(cacheKey) || 0;
    this.updateCache(cacheKey, current + 1);
  }

  private async updateLogStream(logEntry: AgentLogEntry): Promise<void> {
    // This would update real-time log streams for users viewing logs
    console.log(`Log stream updated for agent ${logEntry.agentId}:`, logEntry.message);
  }

  private async processGovernanceLogEvent(logEntry: AgentLogEntry): Promise<void> {
    // Process governance-specific log events
    console.log(`Governance event processed for agent ${logEntry.agentId}:`, logEntry);
  }

  private async logUserAccess(userId: string, agentId: string, action: string, context: any): Promise<void> {
    await this.storage.set('user_access_log', `${userId}_${agentId}_${Date.now()}`, {
      userId,
      agentId,
      action,
      context,
      timestamp: new Date().toISOString(),
      ipAddress: 'unknown' // Would be populated by backend
    });
  }

  private async logDataProcessing(agentId: string, action: string, context: any): Promise<void> {
    await this.storage.set('data_processing_log', `${agentId}_${Date.now()}`, {
      agentId,
      action,
      context,
      timestamp: new Date().toISOString()
    });
  }
}

// Export singleton instance
export const deployedAgentDataService = new DeployedAgentDataService(
  new UnifiedStorageService()
);

