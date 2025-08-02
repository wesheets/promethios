/**
 * Lifecycle Integration Extension
 * 
 * Provides standardized lifecycle event integration for agent workflows.
 * Follows the established extension pattern and provides hooks for triggering
 * lifecycle events from existing services without breaking functionality.
 */

import { Extension } from './Extension';
import { agentLifecycleService, AgentLifecycleService } from '../services/AgentLifecycleService';
import { AgentProfile } from '../services/UserAgentStorageService';

export interface LifecycleEventResult {
  success: boolean;
  eventId?: string;
  error?: string;
}

export interface LifecycleHookOptions {
  retryOnFailure?: boolean;
  maxRetries?: number;
  logFailures?: boolean;
  throwOnError?: boolean;
}

/**
 * Extension for integrating lifecycle tracking into existing agent workflows
 */
export class LifecycleIntegrationExtension extends Extension {
  private lifecycleService: AgentLifecycleService;
  private defaultOptions: LifecycleHookOptions = {
    retryOnFailure: true,
    maxRetries: 3,
    logFailures: true,
    throwOnError: false
  };

  constructor() {
    super('LifecycleIntegration', '1.0.0');
    this.lifecycleService = agentLifecycleService;
  }

  /**
   * Initialize the extension
   */
  async initialize(): Promise<boolean> {
    try {
      console.log('🔄 Initializing LifecycleIntegrationExtension...');
      
      // Verify that the lifecycle service is available
      if (!this.lifecycleService) {
        throw new Error('AgentLifecycleService not available');
      }
      
      this.enable();
      console.log('✅ LifecycleIntegrationExtension initialized successfully');
      return true;
      
    } catch (error) {
      console.error('❌ Failed to initialize LifecycleIntegrationExtension:', error);
      return false;
    }
  }

  /**
   * Trigger agent created lifecycle event
   */
  async triggerAgentCreated(
    agent: AgentProfile, 
    options: LifecycleHookOptions = {}
  ): Promise<LifecycleEventResult> {
    if (!this.isEnabled()) {
      return { success: false, error: 'Extension not enabled' };
    }

    const opts = { ...this.defaultOptions, ...options };
    
    try {
      console.log(`🎯 Triggering agent created lifecycle event for: ${agent.identity.name}`);
      
      await this.lifecycleService.onAgentCreated(agent);
      
      console.log(`✅ Agent created lifecycle event completed for: ${agent.identity.name}`);
      return { success: true };
      
    } catch (error) {
      return this.handleLifecycleError('agent created', error, opts);
    }
  }

  /**
   * Trigger agent wrapped lifecycle event
   */
  async triggerAgentWrapped(
    testAgentId: string,
    productionAgentId: string,
    userId: string,
    options: LifecycleHookOptions = {}
  ): Promise<LifecycleEventResult> {
    if (!this.isEnabled()) {
      return { success: false, error: 'Extension not enabled' };
    }

    const opts = { ...this.defaultOptions, ...options };
    
    try {
      console.log(`🎯 Triggering agent wrapped lifecycle event: ${testAgentId} → ${productionAgentId}`);
      
      const result = await this.lifecycleService.onAgentWrapped(testAgentId, productionAgentId, userId);
      
      if (result.success) {
        console.log(`✅ Agent wrapped lifecycle event completed: ${testAgentId} → ${productionAgentId}`);
        return { success: true };
      } else {
        throw new Error(result.error || 'Agent wrapping failed');
      }
      
    } catch (error) {
      return this.handleLifecycleError('agent wrapped', error, opts);
    }
  }

  /**
   * Trigger agent deployed lifecycle event
   */
  async triggerAgentDeployed(
    agentId: string,
    deploymentId: string,
    deploymentUrl: string,
    userId: string,
    environment: string = 'production',
    options: LifecycleHookOptions = {}
  ): Promise<LifecycleEventResult> {
    if (!this.isEnabled()) {
      return { success: false, error: 'Extension not enabled' };
    }

    const opts = { ...this.defaultOptions, ...options };
    
    try {
      console.log(`🎯 Triggering agent deployed lifecycle event: ${agentId} to ${deploymentUrl}`);
      
      const result = await this.lifecycleService.onAgentDeployed(
        agentId, 
        deploymentId, 
        deploymentUrl, 
        userId, 
        environment
      );
      
      if (result.success) {
        console.log(`✅ Agent deployed lifecycle event completed: ${agentId} to ${deploymentUrl}`);
        return { success: true, eventId: result.deploymentId };
      } else {
        throw new Error(result.error || 'Agent deployment failed');
      }
      
    } catch (error) {
      return this.handleLifecycleError('agent deployed', error, opts);
    }
  }

  /**
   * Handle lifecycle event errors with retry logic
   */
  private async handleLifecycleError(
    eventType: string,
    error: any,
    options: LifecycleHookOptions,
    retryCount: number = 0
  ): Promise<LifecycleEventResult> {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    if (options.logFailures) {
      console.warn(`⚠️ Lifecycle event failed (${eventType}):`, errorMessage);
    }
    
    // Retry logic
    if (options.retryOnFailure && retryCount < (options.maxRetries || 0)) {
      console.log(`🔄 Retrying lifecycle event (${eventType}), attempt ${retryCount + 1}`);
      
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
      
      // Note: This is a simplified retry - in a real implementation, 
      // we'd need to pass the original parameters through
      return { success: false, error: `Retry not implemented for ${eventType}` };
    }
    
    // Handle error based on options
    if (options.throwOnError) {
      throw error;
    }
    
    return { 
      success: false, 
      error: `Lifecycle event failed (${eventType}): ${errorMessage}` 
    };
  }

  /**
   * Get lifecycle statistics for monitoring
   */
  async getLifecycleStats(userId: string): Promise<{
    totalEvents: number;
    eventsByType: Record<string, number>;
    recentEvents: number;
  }> {
    try {
      const summary = await this.lifecycleService.getUserAgentLifecycleSummary(userId);
      
      return {
        totalEvents: summary.recentEvents.length,
        eventsByType: summary.recentEvents.reduce((acc, event) => {
          acc[event.eventType] = (acc[event.eventType] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        recentEvents: summary.recentEvents.filter(
          event => new Date().getTime() - new Date(event.timestamp).getTime() < 24 * 60 * 60 * 1000
        ).length
      };
      
    } catch (error) {
      console.error('Failed to get lifecycle stats:', error);
      return { totalEvents: 0, eventsByType: {}, recentEvents: 0 };
    }
  }

  /**
   * Cleanup resources when extension is destroyed
   */
  destroy(): void {
    console.log('🧹 Cleaning up LifecycleIntegrationExtension...');
    super.destroy();
  }
}

// Export singleton instance
export const lifecycleIntegrationExtension = new LifecycleIntegrationExtension();

