/**
 * Agent Lifecycle Service
 * 
 * Manages the complete lifecycle of agents from creation to deployment,
 * with integrated metrics tracking and governance compliance.
 */

import { metricsCollectionExtension, AgentMetricsProfile, DeploymentReference } from '../extensions/MetricsCollectionExtension';
import { UserAgentStorageService, AgentProfile } from './UserAgentStorageService';
import { unifiedStorage } from './UnifiedStorageService';

export interface AgentLifecycleEvent {
  eventId: string;
  agentId: string;
  eventType: 'created' | 'wrapped' | 'deployed' | 'promoted' | 'deactivated';
  timestamp: Date;
  userId: string;
  metadata?: Record<string, any>;
}

export interface AgentWithLifecycleStatus {
  agent: AgentProfile;
  lifecycleStatus: {
    created: boolean;
    wrapped: boolean;
    deployed: boolean;
  };
  lastActivity: Date | null;
  events: AgentLifecycleEvent[];
}

export interface AgentWrappingResult {
  success: boolean;
  productionAgentId?: string;
  metricsProfile?: AgentMetricsProfile;
  error?: string;
}

export interface AgentDeploymentResult {
  success: boolean;
  deploymentId?: string;
  deploymentUrl?: string;
  metricsUpdated?: boolean;
  error?: string;
}

/**
 * Service for managing agent lifecycle with metrics integration
 */
export class AgentLifecycleService {
  private static instance: AgentLifecycleService;
  private agentStorageService: UserAgentStorageService;

  private constructor() {
    this.agentStorageService = new UserAgentStorageService();
  }

  static getInstance(): AgentLifecycleService {
    if (!AgentLifecycleService.instance) {
      AgentLifecycleService.instance = new AgentLifecycleService();
    }
    return AgentLifecycleService.instance;
  }

  /**
   * Handle agent creation with metrics profile initialization
   */
  async onAgentCreated(agent: AgentProfile): Promise<void> {
    try {
      console.log('🎯 Agent lifecycle: Processing agent creation for', agent.identity.name);
      
      // Create test agent metrics profile
      await metricsCollectionExtension.createTestAgentProfile(
        agent.identity.id,
        agent.identity.name,
        agent.identity.ownerId,
        'single'
      );
      
      // Log lifecycle event
      await this.logLifecycleEvent({
        eventId: `create_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        agentId: agent.identity.id,
        eventType: 'created',
        timestamp: new Date(),
        userId: agent.identity.ownerId,
        metadata: {
          agentName: agent.identity.name,
          agentVersion: agent.identity.version,
          metricsProfileCreated: true
        }
      });
      
      console.log('✅ Agent creation lifecycle completed successfully');
      
    } catch (error) {
      console.error('❌ Failed to process agent creation lifecycle:', error);
      throw error;
    }
  }

  /**
   * Handle agent wrapping (test to production promotion)
   */
  async onAgentWrapped(testAgentId: string, productionAgentId: string, userId: string): Promise<AgentWrappingResult> {
    try {
      console.log('🎯 Agent lifecycle: Processing agent wrapping', testAgentId, '->', productionAgentId);
      
      // Promote test agent to production
      const productionProfile = await metricsCollectionExtension.promoteToProductionAgent(
        testAgentId,
        productionAgentId
      );
      
      // Log lifecycle event
      await this.logLifecycleEvent({
        eventId: `wrap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        agentId: productionAgentId,
        eventType: 'wrapped',
        timestamp: new Date(),
        userId,
        metadata: {
          testAgentId,
          productionAgentId,
          metricsPromoted: true
        }
      });
      
      console.log('✅ Agent wrapping lifecycle completed successfully');
      
      return {
        success: true,
        productionAgentId,
        metricsProfile: productionProfile
      };
      
    } catch (error) {
      console.error('❌ Failed to process agent wrapping lifecycle:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown wrapping error'
      };
    }
  }

  /**
   * Handle agent deployment with metrics integration
   */
  async onAgentDeployed(
    agentId: string,
    deploymentId: string,
    deploymentUrl: string,
    userId: string,
    environment: string = 'production'
  ): Promise<AgentDeploymentResult> {
    try {
      console.log('🎯 Agent lifecycle: Processing agent deployment', agentId, 'to', deploymentUrl);
      
      // Create deployment reference
      const deploymentRef: DeploymentReference = {
        deploymentId,
        environment,
        distributionMethod: 'api',
        createdAt: new Date(),
        status: 'active',
        url: deploymentUrl
      };
      
      // Add deployment to production agent metrics
      await metricsCollectionExtension.addDeploymentToAgent(agentId, deploymentRef);
      
      // Log lifecycle event
      await this.logLifecycleEvent({
        eventId: `deploy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        agentId,
        eventType: 'deployed',
        timestamp: new Date(),
        userId,
        metadata: {
          deploymentId,
          deploymentUrl,
          environment,
          metricsUpdated: true
        }
      });
      
      console.log('✅ Agent deployment lifecycle completed successfully');
      
      return {
        success: true,
        deploymentId,
        deploymentUrl,
        metricsUpdated: true
      };
      
    } catch (error) {
      console.error('❌ Failed to process agent deployment lifecycle:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown deployment error'
      };
    }
  }

  /**
   * Handle agent promotion (test to production)
   */
  async onAgentPromoted(testAgentId: string, productionAgentId: string, userId: string): Promise<void> {
    try {
      console.log('🎯 Agent lifecycle: Processing agent promotion', testAgentId, '->', productionAgentId);
      
      // This is handled by onAgentWrapped, but we log it separately for clarity
      await this.logLifecycleEvent({
        eventId: `promote_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        agentId: productionAgentId,
        eventType: 'promoted',
        timestamp: new Date(),
        userId,
        metadata: {
          testAgentId,
          productionAgentId,
          promotionReason: 'agent_wrapping'
        }
      });
      
      console.log('✅ Agent promotion lifecycle completed successfully');
      
    } catch (error) {
      console.error('❌ Failed to process agent promotion lifecycle:', error);
      throw error;
    }
  }

  /**
   * Get agent lifecycle history
   */
  async getAgentLifecycleHistory(agentId: string): Promise<AgentLifecycleEvent[]> {
    try {
      const allEvents = await unifiedStorage.getMany<AgentLifecycleEvent>('agent_lifecycle_events', []);
      return allEvents.filter(event => event.agentId === agentId)
                     .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (error) {
      console.error('❌ Failed to get agent lifecycle history:', error);
      return [];
    }
  }

  /**
   * Get production agents with their lifecycle status for dashboard display
   */
  async getProductionAgentsWithLifecycleStatus(userId: string): Promise<AgentWithLifecycleStatus[]> {
    try {
      console.log('🔍 Loading production agents with lifecycle status for user:', userId);
      
      // Set user context for agent storage service
      this.agentStorageService.setCurrentUser(userId);
      
      // Load all user agents
      const allAgents = await this.agentStorageService.loadUserAgents();
      console.log('📊 Total agents loaded:', allAgents.length);
      
      // Filter for production agents only
      const productionAgents = allAgents.filter(agent => 
        agent.identity.id.includes('-production') || 
        agent.identity.id.startsWith(`${userId}_promethios-llm-`) // Include native LLM agents
      );
      console.log('🏭 Production agents found:', productionAgents.length);
      
      // Get all lifecycle events for this user
      const allEvents = await unifiedStorage.getMany<AgentLifecycleEvent>('agent_lifecycle_events', []);
      const userEvents = allEvents.filter(event => event.userId === userId);
      console.log('📝 Lifecycle events found:', userEvents.length);
      
      // Map production agents to lifecycle status
      const agentsWithStatus: AgentWithLifecycleStatus[] = productionAgents.map(agent => {
        const agentEvents = userEvents.filter(event => event.agentId === agent.identity.id);
        
        // Determine lifecycle status based on events and agent properties
        const hasCreatedEvent = agentEvents.some(e => e.eventType === 'created');
        const hasWrappedEvent = agentEvents.some(e => e.eventType === 'wrapped');
        const hasDeployedEvent = agentEvents.some(e => e.eventType === 'deployed');
        
        // For production agents, assume they are at least wrapped if they exist
        const isCreated = hasCreatedEvent || true; // All existing agents are created
        const isWrapped = hasWrappedEvent || agent.isWrapped || agent.identity.id.includes('-production');
        const isDeployed = hasDeployedEvent || agent.isDeployed;
        
        return {
          agent,
          lifecycleStatus: {
            created: isCreated,
            wrapped: isWrapped,
            deployed: isDeployed
          },
          lastActivity: agentEvents.length > 0 
            ? new Date(Math.max(...agentEvents.map(e => new Date(e.timestamp).getTime())))
            : agent.lastActivity || agent.identity.lastModifiedDate,
          events: agentEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        };
      });
      
      // Sort by last activity (most recent first)
      agentsWithStatus.sort((a, b) => {
        const aTime = a.lastActivity ? new Date(a.lastActivity).getTime() : 0;
        const bTime = b.lastActivity ? new Date(b.lastActivity).getTime() : 0;
        return bTime - aTime;
      });
      
      console.log('✅ Production agents with lifecycle status prepared:', agentsWithStatus.length);
      return agentsWithStatus;
      
    } catch (error) {
      console.error('❌ Failed to get production agents with lifecycle status:', error);
      return [];
    }
  }

  /**
   * Get user's agent lifecycle summary
   */
  async getUserAgentLifecycleSummary(userId: string): Promise<{
    totalAgents: number;
    testAgents: number;
    productionAgents: number;
    deployedAgents: number;
    recentEvents: AgentLifecycleEvent[];
  }> {
    try {
      const allEvents = await unifiedStorage.getMany<AgentLifecycleEvent>('agent_lifecycle_events', []);
      const userEvents = allEvents.filter(event => event.userId === userId);
      
      // Get agent metrics profiles for counts
      const { testAgents, productionAgents } = await metricsCollectionExtension.getUserAgentProfiles(userId);
      
      // Count deployed agents (production agents with deployments)
      const deployedAgents = productionAgents.filter(agent => agent.deployments.length > 0).length;
      
      // Get recent events (last 10)
      const recentEvents = userEvents
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10);
      
      return {
        totalAgents: testAgents.length + productionAgents.length,
        testAgents: testAgents.length,
        productionAgents: productionAgents.length,
        deployedAgents,
        recentEvents
      };
      
    } catch (error) {
      console.error('❌ Failed to get user agent lifecycle summary:', error);
      return {
        totalAgents: 0,
        testAgents: 0,
        productionAgents: 0,
        deployedAgents: 0,
        recentEvents: []
      };
    }
  }

  /**
   * Log lifecycle event
   */
  private async logLifecycleEvent(event: AgentLifecycleEvent): Promise<void> {
    try {
      await unifiedStorage.set('agent_lifecycle_events', event.eventId, event);
      console.log(`📝 Logged lifecycle event: ${event.eventType} for agent ${event.agentId}`);
    } catch (error) {
      console.error('❌ Failed to log lifecycle event:', error);
      // Don't throw error for logging failures
    }
  }
}

// Export singleton instance
export const agentLifecycleService = AgentLifecycleService.getInstance();

