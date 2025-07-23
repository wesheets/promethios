/**
 * Agent Trust Boundary Extension for Promethios
 * 
 * Provides agent-facing trust boundary APIs and management capabilities
 * following established extension patterns with backward compatibility.
 * Enables agents to query trust relationships and make intelligent collaboration decisions.
 */

import { User } from 'firebase/auth';
import { trustBackendService, TrustEvaluation } from '../services/trustBackendService';
import { agentBackendService, BackendAgentProfile } from '../services/agentBackendService';
import { governanceNotificationExtension } from './GovernanceNotificationExtension';
import { multiAgentGovernanceExtension } from './MultiAgentGovernanceExtension';

export interface AgentTrustBoundaryConfig {
  enableAgentQueries: boolean;
  enableRealTimeUpdates: boolean;
  enableCollaborationDiscovery: boolean;
  queryRateLimit: {
    requestsPerMinute: number;
    burstLimit: number;
  };
  trustThresholds: {
    collaboration: {
      minimum: number;
      recommended: number;
      high_confidence: number;
    };
    data_sharing: {
      minimum: number;
      sensitive_data: number;
      financial_data: number;
      healthcare_data: number;
    };
    delegation: {
      minimum: number;
      critical_tasks: number;
    };
  };
  boundaryTypes: {
    direct: { enabled: boolean; weight: number };
    delegated: { enabled: boolean; weight: number };
    transitive: { enabled: boolean; weight: number; max_hops: number };
    federated: { enabled: boolean; weight: number };
  };
  caching: {
    trustScoreTTL: number; // seconds
    boundaryConfigTTL: number; // seconds
    collaborationDiscoveryTTL: number; // seconds
  };
  security: {
    requireGovernanceIdentity: boolean;
    enableAuditLogging: boolean;
    restrictCrossOrgQueries: boolean;
  };
}

export interface AgentTrustBoundary {
  boundary_id: string;
  source_agent_id: string;
  target_agent_id: string;
  source_name: string;
  target_name: string;
  trust_level: number;
  confidence_level: number;
  boundary_type: 'direct' | 'delegated' | 'transitive' | 'federated';
  status: 'active' | 'suspended' | 'expired' | 'revoked';
  created_at: string;
  last_updated: string;
  expires_at?: string;
  
  // Trust dimensions breakdown
  trust_dimensions: {
    competence: number;
    reliability: number;
    honesty: number;
    transparency: number;
  };
  
  // Collaboration capabilities
  collaboration_permissions: {
    data_sharing: boolean;
    task_delegation: boolean;
    resource_access: boolean;
    decision_making: boolean;
  };
  
  // Policy requirements
  policy_requirements: Array<{
    policy_id: string;
    policy_type: 'access' | 'data' | 'operation' | 'resource';
    compliance_required: boolean;
    policy_config: any;
  }>;
  
  // Risk assessment
  risk_assessment: {
    risk_level: 'low' | 'medium' | 'high' | 'critical';
    risk_factors: string[];
    mitigation_required: boolean;
  };
  
  // Historical context
  interaction_history: {
    total_interactions: number;
    successful_collaborations: number;
    failed_collaborations: number;
    last_interaction: string;
  };
  
  metadata: any;
}

export interface AgentTrustQuery {
  requesting_agent_id: string;
  target_agent_id?: string;
  query_type: 'direct_trust' | 'collaboration_discovery' | 'trust_verification' | 'boundary_status';
  filters?: {
    min_trust_level?: number;
    max_trust_level?: number;
    boundary_types?: string[];
    collaboration_types?: string[];
    policy_requirements?: string[];
    risk_levels?: string[];
  };
  limit?: number;
  include_history?: boolean;
  include_predictions?: boolean;
}

export interface AgentTrustQueryResponse {
  query_id: string;
  requesting_agent_id: string;
  timestamp: string;
  boundaries: AgentTrustBoundary[];
  total_results: number;
  query_metadata: {
    processing_time_ms: number;
    cache_hit: boolean;
    trust_calculation_method: string;
  };
  recommendations?: {
    suggested_collaborations: Array<{
      agent_id: string;
      agent_name: string;
      trust_score: number;
      collaboration_potential: number;
      recommended_interaction_type: string;
    }>;
    risk_warnings: Array<{
      agent_id: string;
      risk_level: string;
      warning_message: string;
      mitigation_suggestions: string[];
    }>;
  };
}

export interface CollaborationDiscoveryRequest {
  requesting_agent_id: string;
  collaboration_type: 'data_processing' | 'task_execution' | 'decision_making' | 'resource_sharing';
  requirements: {
    min_trust_level: number;
    required_capabilities?: string[];
    policy_compliance?: string[];
    max_response_time?: number;
    geographic_restrictions?: string[];
  };
  preferences?: {
    preferred_agents?: string[];
    excluded_agents?: string[];
    collaboration_history_weight?: number;
  };
}

export interface TrustBoundaryAlert {
  alert_id: string;
  alert_type: 'trust_degradation' | 'boundary_violation' | 'collaboration_opportunity' | 'risk_escalation';
  severity: 'info' | 'warning' | 'critical';
  affected_agents: string[];
  message: string;
  details: any;
  timestamp: string;
  requires_action: boolean;
  suggested_actions?: string[];
}

/**
 * Agent Trust Boundary Extension Class
 * Provides agent-facing trust boundary functionality following extension patterns
 */
export class AgentTrustBoundaryExtension {
  private static instance: AgentTrustBoundaryExtension;
  private initialized = false;
  private config: AgentTrustBoundaryConfig;
  private queryCache = new Map<string, any>();
  private rateLimitTracker = new Map<string, any>();
  private activeSubscriptions = new Map<string, any>();

  private constructor() {
    this.config = {
      enableAgentQueries: true,
      enableRealTimeUpdates: true,
      enableCollaborationDiscovery: true,
      queryRateLimit: {
        requestsPerMinute: 60,
        burstLimit: 10
      },
      trustThresholds: {
        collaboration: {
          minimum: 0.6,
          recommended: 0.75,
          high_confidence: 0.9
        },
        data_sharing: {
          minimum: 0.7,
          sensitive_data: 0.85,
          financial_data: 0.9,
          healthcare_data: 0.95
        },
        delegation: {
          minimum: 0.8,
          critical_tasks: 0.95
        }
      },
      boundaryTypes: {
        direct: { enabled: true, weight: 1.0 },
        delegated: { enabled: true, weight: 0.8 },
        transitive: { enabled: true, weight: 0.6, max_hops: 3 },
        federated: { enabled: true, weight: 0.7 }
      },
      caching: {
        trustScoreTTL: 300, // 5 minutes
        boundaryConfigTTL: 1800, // 30 minutes
        collaborationDiscoveryTTL: 600 // 10 minutes
      },
      security: {
        requireGovernanceIdentity: true,
        enableAuditLogging: true,
        restrictCrossOrgQueries: false
      }
    };
  }

  static getInstance(): AgentTrustBoundaryExtension {
    if (!AgentTrustBoundaryExtension.instance) {
      AgentTrustBoundaryExtension.instance = new AgentTrustBoundaryExtension();
    }
    return AgentTrustBoundaryExtension.instance;
  }

  async initialize(config?: Partial<AgentTrustBoundaryConfig>): Promise<boolean> {
    if (this.initialized) {
      return true;
    }

    try {
      // Merge provided config with defaults
      if (config) {
        this.config = { ...this.config, ...config };
      }

      // Initialize dependencies
      await this.initializeDependencies();

      // Register with extension registry
      await this.registerWithExtensionSystem();

      // Start background services
      if (this.config.enableRealTimeUpdates) {
        this.startRealTimeUpdateService();
      }

      this.initialized = true;
      console.log('AgentTrustBoundaryExtension initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize AgentTrustBoundaryExtension:', error);
      return false;
    }
  }

  private async initializeDependencies(): Promise<void> {
    // Ensure required extensions are initialized
    if (!governanceNotificationExtension.isInitialized()) {
      await governanceNotificationExtension.initialize();
    }

    if (!multiAgentGovernanceExtension.isInitialized()) {
      await multiAgentGovernanceExtension.initialize();
    }

    console.log('AgentTrustBoundaryExtension dependencies initialized');
  }

  private async registerWithExtensionSystem(): Promise<void> {
    // Register extension points and hooks
    console.log('Registering AgentTrustBoundaryExtension with extension system');
    
    // Extension points would be registered here in a full implementation
    // This follows the pattern from other extensions
  }

  private startRealTimeUpdateService(): void {
    // Start real-time trust boundary monitoring
    setInterval(async () => {
      await this.processRealTimeUpdates();
    }, 30000); // Check every 30 seconds

    console.log('Real-time trust boundary update service started');
  }

  private async processRealTimeUpdates(): Promise<void> {
    try {
      // Process pending trust updates and notify subscribed agents
      for (const [agentId, subscription] of this.activeSubscriptions) {
        await this.checkForTrustUpdates(agentId, subscription);
      }
    } catch (error) {
      console.error('Error processing real-time trust updates:', error);
    }
  }

  private async checkForTrustUpdates(agentId: string, subscription: any): Promise<void> {
    // Implementation would check for trust score changes and notify agent
    console.log(`Checking trust updates for agent ${agentId}`);
  }

  /**
   * Query trust boundaries for an agent
   */
  async queryAgentTrustBoundaries(query: AgentTrustQuery): Promise<AgentTrustQueryResponse> {
    try {
      // Validate agent authentication and rate limiting
      await this.validateAgentQuery(query.requesting_agent_id);

      // Check cache first
      const cacheKey = this.generateCacheKey(query);
      const cachedResult = this.queryCache.get(cacheKey);
      if (cachedResult && !this.isCacheExpired(cachedResult)) {
        return cachedResult.data;
      }

      // Process query
      const startTime = Date.now();
      const boundaries = await this.processTrustBoundaryQuery(query);
      const processingTime = Date.now() - startTime;

      // Generate recommendations if requested
      const recommendations = query.query_type === 'collaboration_discovery' 
        ? await this.generateCollaborationRecommendations(query)
        : undefined;

      const response: AgentTrustQueryResponse = {
        query_id: this.generateQueryId(),
        requesting_agent_id: query.requesting_agent_id,
        timestamp: new Date().toISOString(),
        boundaries,
        total_results: boundaries.length,
        query_metadata: {
          processing_time_ms: processingTime,
          cache_hit: false,
          trust_calculation_method: 'enhanced_multi_dimensional'
        },
        recommendations
      };

      // Cache result
      this.cacheQueryResult(cacheKey, response);

      // Log query for audit
      if (this.config.security.enableAuditLogging) {
        await this.logAgentQuery(query, response);
      }

      return response;
    } catch (error) {
      console.error('Error querying agent trust boundaries:', error);
      throw error;
    }
  }

  private async validateAgentQuery(agentId: string): Promise<void> {
    // Check rate limiting
    if (!this.checkRateLimit(agentId)) {
      throw new Error('Rate limit exceeded for agent queries');
    }

    // Validate governance identity if required
    if (this.config.security.requireGovernanceIdentity) {
      const agentProfile = await agentBackendService.getAgentProfile(agentId);
      if (!agentProfile || !agentProfile.governance_identity) {
        throw new Error('Valid governance identity required for trust queries');
      }
    }
  }

  private checkRateLimit(agentId: string): boolean {
    const now = Date.now();
    const windowStart = now - 60000; // 1 minute window
    
    let agentRequests = this.rateLimitTracker.get(agentId) || [];
    
    // Remove old requests outside the window
    agentRequests = agentRequests.filter((timestamp: number) => timestamp > windowStart);
    
    // Check limits
    if (agentRequests.length >= this.config.queryRateLimit.requestsPerMinute) {
      return false;
    }
    
    // Add current request
    agentRequests.push(now);
    this.rateLimitTracker.set(agentId, agentRequests);
    
    return true;
  }

  private async processTrustBoundaryQuery(query: AgentTrustQuery): Promise<AgentTrustBoundary[]> {
    const boundaries: AgentTrustBoundary[] = [];

    if (query.query_type === 'direct_trust' && query.target_agent_id) {
      // Query direct trust relationship
      const trustScore = await trustBackendService.getAgentPairTrustScore(
        query.requesting_agent_id, 
        query.target_agent_id
      );
      
      if (trustScore !== null) {
        const boundary = await this.createTrustBoundaryFromScore(
          query.requesting_agent_id,
          query.target_agent_id,
          trustScore
        );
        boundaries.push(boundary);
      }
    } else if (query.query_type === 'collaboration_discovery') {
      // Discover potential collaboration partners
      const allRelationships = await trustBackendService.getAgentTrustRelationships(query.requesting_agent_id);
      
      for (const relationship of allRelationships) {
        if (this.matchesQueryFilters(relationship, query.filters)) {
          const boundary = await this.createTrustBoundaryFromEvaluation(
            query.requesting_agent_id,
            relationship
          );
          boundaries.push(boundary);
        }
      }
    }

    return boundaries;
  }

  private async createTrustBoundaryFromScore(
    sourceAgentId: string,
    targetAgentId: string,
    trustScore: number
  ): Promise<AgentTrustBoundary> {
    // Get agent profiles for names
    const sourceProfile = await agentBackendService.getAgentProfile(sourceAgentId);
    const targetProfile = await agentBackendService.getAgentProfile(targetAgentId);

    return {
      boundary_id: `boundary_${sourceAgentId}_${targetAgentId}`,
      source_agent_id: sourceAgentId,
      target_agent_id: targetAgentId,
      source_name: sourceProfile?.name || `Agent ${sourceAgentId}`,
      target_name: targetProfile?.name || `Agent ${targetAgentId}`,
      trust_level: Math.round(trustScore * 100),
      confidence_level: 0.85, // Default confidence
      boundary_type: trustScore > 0.8 ? 'direct' : 'delegated',
      status: trustScore > 0.6 ? 'active' : 'suspended',
      created_at: new Date().toISOString(),
      last_updated: new Date().toISOString(),
      trust_dimensions: {
        competence: trustScore * 0.9,
        reliability: trustScore * 1.1,
        honesty: trustScore,
        transparency: trustScore * 0.95
      },
      collaboration_permissions: {
        data_sharing: trustScore > this.config.trustThresholds.data_sharing.minimum,
        task_delegation: trustScore > this.config.trustThresholds.delegation.minimum,
        resource_access: trustScore > this.config.trustThresholds.collaboration.minimum,
        decision_making: trustScore > this.config.trustThresholds.collaboration.high_confidence
      },
      policy_requirements: [],
      risk_assessment: {
        risk_level: trustScore > 0.8 ? 'low' : trustScore > 0.6 ? 'medium' : 'high',
        risk_factors: trustScore < 0.7 ? ['Low trust score', 'Limited interaction history'] : [],
        mitigation_required: trustScore < 0.6
      },
      interaction_history: {
        total_interactions: 0,
        successful_collaborations: 0,
        failed_collaborations: 0,
        last_interaction: new Date().toISOString()
      },
      metadata: {}
    };
  }

  private async createTrustBoundaryFromEvaluation(
    requestingAgentId: string,
    evaluation: TrustEvaluation
  ): Promise<AgentTrustBoundary> {
    const targetAgentId = evaluation.agent_id === requestingAgentId ? evaluation.target_id : evaluation.agent_id;
    return this.createTrustBoundaryFromScore(requestingAgentId, targetAgentId, evaluation.trust_score);
  }

  private matchesQueryFilters(evaluation: TrustEvaluation, filters?: any): boolean {
    if (!filters) return true;

    if (filters.min_trust_level && evaluation.trust_score < filters.min_trust_level) {
      return false;
    }

    if (filters.max_trust_level && evaluation.trust_score > filters.max_trust_level) {
      return false;
    }

    // Additional filter logic would go here

    return true;
  }

  private async generateCollaborationRecommendations(query: AgentTrustQuery): Promise<any> {
    // Generate intelligent collaboration recommendations
    return {
      suggested_collaborations: [],
      risk_warnings: []
    };
  }

  private generateCacheKey(query: AgentTrustQuery): string {
    return `trust_query_${query.requesting_agent_id}_${query.query_type}_${JSON.stringify(query.filters)}`;
  }

  private generateQueryId(): string {
    return `query_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private isCacheExpired(cachedResult: any): boolean {
    const now = Date.now();
    const age = now - cachedResult.timestamp;
    return age > (this.config.caching.trustScoreTTL * 1000);
  }

  private cacheQueryResult(cacheKey: string, response: AgentTrustQueryResponse): void {
    this.queryCache.set(cacheKey, {
      data: response,
      timestamp: Date.now()
    });
  }

  private async logAgentQuery(query: AgentTrustQuery, response: AgentTrustQueryResponse): Promise<void> {
    console.log('Agent trust query audit log:', {
      query_id: response.query_id,
      requesting_agent: query.requesting_agent_id,
      query_type: query.query_type,
      results_count: response.total_results,
      timestamp: response.timestamp
    });
  }

  /**
   * Subscribe to real-time trust boundary updates
   */
  async subscribeToTrustUpdates(agentId: string, callback: (alert: TrustBoundaryAlert) => void): Promise<string> {
    const subscriptionId = `sub_${agentId}_${Date.now()}`;
    
    this.activeSubscriptions.set(subscriptionId, {
      agentId,
      callback,
      created_at: new Date().toISOString()
    });

    console.log(`Agent ${agentId} subscribed to trust updates with ID ${subscriptionId}`);
    return subscriptionId;
  }

  /**
   * Unsubscribe from trust boundary updates
   */
  async unsubscribeFromTrustUpdates(subscriptionId: string): Promise<void> {
    this.activeSubscriptions.delete(subscriptionId);
    console.log(`Unsubscribed from trust updates: ${subscriptionId}`);
  }

  /**
   * Get trust boundary configuration for an agent
   */
  async getAgentTrustConfiguration(agentId: string): Promise<any> {
    // Return agent-specific trust boundary configuration
    return {
      agent_id: agentId,
      trust_thresholds: this.config.trustThresholds,
      boundary_types: this.config.boundaryTypes,
      collaboration_permissions: {
        can_query_trust: true,
        can_discover_collaborators: true,
        can_receive_updates: true
      }
    };
  }

  /**
   * Update trust boundary configuration
   */
  async updateTrustConfiguration(agentId: string, updates: any): Promise<void> {
    // Update agent-specific trust configuration
    console.log(`Updating trust configuration for agent ${agentId}:`, updates);
    
    // Notify governance system of configuration changes
    await governanceNotificationExtension.sendNotification({
      type: 'trust_configuration_updated',
      severity: 'info',
      message: `Trust boundary configuration updated for agent ${agentId}`,
      details: updates,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Check if extension is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get extension configuration
   */
  getConfiguration(): AgentTrustBoundaryConfig {
    return { ...this.config };
  }

  /**
   * Update extension configuration
   */
  async updateConfiguration(updates: Partial<AgentTrustBoundaryConfig>): Promise<void> {
    this.config = { ...this.config, ...updates };
    console.log('AgentTrustBoundaryExtension configuration updated');
  }
}

// Export singleton instance
export const agentTrustBoundaryExtension = AgentTrustBoundaryExtension.getInstance();

