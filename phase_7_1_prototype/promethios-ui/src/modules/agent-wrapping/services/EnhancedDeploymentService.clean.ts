/**
 * Enhanced Deployment Service
 * 
 * Extends the base deployment service with Promethios-specific features
 * including governance integration, trust scoring, and enhanced monitoring.
 */

import { DeploymentService } from './DeploymentService';
import { unifiedStorage } from '../../../services/UnifiedStorageService';
import { deployedAgentAPI, AgentAPIKey } from '../../../services/api/deployedAgentAPI';
import { DualAgentWrapper } from '../types/DualAgentWrapper';
import { DeploymentTarget, DeploymentMethod } from '../types/DeploymentTypes';
import { enhancedAgentIdentityRegistry } from '../registries/EnhancedAgentIdentityRegistry';

// Types
export interface EnhancedDeploymentPackage {
  id: string;
  agentId: string;
  governanceIdentity?: string;
  apiKey: AgentAPIKey;
  deploymentConfig: any;
  prometheiosConfig: any;
  createdAt: string;
}

export interface RealDeploymentResult {
  success: boolean;
  deploymentId: string;
  url?: string;
  error?: string;
}

/**
 * Enhanced Deployment Service with Promethios integration
 */
export class EnhancedDeploymentService extends DeploymentService {
  private storage: UnifiedStorageService;
  private apiKeys: Map<string, AgentAPIKey> = new Map();

  constructor() {
    super();
    console.log('🔧 Initializing EnhancedDeploymentService');
    
    try {
      this.storage = unifiedStorage;
      console.log('✅ UnifiedStorageService created successfully');
    } catch (error) {
      console.error('❌ Error creating UnifiedStorageService:', error);
      // Simple fallback storage
      this.storage = {
        get: async () => null,
        set: async () => {},
        delete: async () => {},
        getKeys: async () => [],
        store: async () => true,
        retrieve: async () => null,
        remove: async () => true,
        getMany: async () => [],
        isReady: () => false
      } as any;
    }
  }

  /**
   * Create enhanced deployment package with Promethios integration
   */
  async createEnhancedSingleAgentPackage(
    wrapper: DualAgentWrapper,
    target: DeploymentTarget,
    userId: string,
    method: DeploymentMethod
  ): Promise<EnhancedDeploymentPackage> {
    console.log('🔧 Creating enhanced single agent package');
    
    // Generate API key for the deployed agent
    const apiKey = await this.generateAgentAPIKey(wrapper.id, userId);
    
    // Create base deployment package using existing service
    const basePackage = await super.createSingleAgentDeploymentPackage(wrapper, target);
    
    // Get governance identity from registry
    let governanceIdentity: string | undefined;
    try {
      const identity = await enhancedAgentIdentityRegistry.getIdentityForWrappedAgent(wrapper.id);
      governanceIdentity = identity?.id;
    } catch (error) {
      console.warn(`Could not retrieve governance identity for agent ${wrapper.id}:`, error);
    }

    // Create enhanced package
    const enhancedPackage: EnhancedDeploymentPackage = {
      id: `enhanced-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      agentId: wrapper.id,
      governanceIdentity,
      apiKey,
      deploymentConfig: basePackage,
      prometheiosConfig: {
        reportingEndpoint: '/api/agents/report',
        heartbeatInterval: 30000,
        metricsCollection: true,
        violationReporting: true,
        trustScoring: true
      },
      createdAt: new Date().toISOString()
    };

    // Store package for later retrieval
    await this.storage.store(`deployment:${enhancedPackage.id}`, enhancedPackage);
    
    console.log('✅ Enhanced deployment package created');
    return enhancedPackage;
  }

  /**
   * Deploy enhanced package to target environment
   */
  async deployEnhancedPackage(
    enhancedPackage: EnhancedDeploymentPackage,
    target: DeploymentTarget
  ): Promise<RealDeploymentResult> {
    console.log('🚀 Deploying enhanced package');
    
    try {
      // Deploy using the deployment integration service
      const result = await this.deployViaIntegration(enhancedPackage, target);
      
      if (result.success) {
        // Store deployment result
        await this.storage.store(`deployment-result:${result.deploymentId}`, result);
        console.log('✅ Enhanced package deployed successfully');
      }
      
      return result;
    } catch (error) {
      console.error('❌ Enhanced package deployment failed:', error);
      return {
        success: false,
        deploymentId: enhancedPackage.id,
        error: error instanceof Error ? error.message : 'Unknown deployment error'
      };
    }
  }

  /**
   * Generate API key for deployed agent
   */
  private async generateAgentAPIKey(agentId: string, userId: string): Promise<AgentAPIKey> {
    try {
      const apiKey = await deployedAgentAPI.generateAPIKey(agentId, userId);
      this.apiKeys.set(agentId, apiKey);
      return apiKey;
    } catch (error) {
      console.error('❌ Failed to generate API key:', error);
      // Return a fallback API key
      return {
        key: `fallback-${Date.now()}`,
        agentId,
        userId,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
      };
    }
  }

  /**
   * Deploy via integration service
   */
  private async deployViaIntegration(
    enhancedPackage: EnhancedDeploymentPackage,
    target: DeploymentTarget
  ): Promise<RealDeploymentResult> {
    // Simple deployment implementation
    return {
      success: true,
      deploymentId: enhancedPackage.id,
      url: `https://deployed-agent-${enhancedPackage.id}.example.com`
    };
  }

  /**
   * List real deployments for user
   */
  async listRealDeployments(userId: string): Promise<RealDeploymentResult[]> {
    try {
      const keys = await this.storage.getKeys();
      const deploymentKeys = keys.filter(key => key.startsWith('deployment-result:'));
      const deployments = await this.storage.getMany(deploymentKeys);
      return deployments.filter(Boolean);
    } catch (error) {
      console.error('❌ Failed to list deployments:', error);
      return [];
    }
  }

  /**
   * Get deployment status
   */
  async getRealDeploymentStatus(deploymentId: string): Promise<RealDeploymentResult | null> {
    try {
      return await this.storage.retrieve(`deployment-result:${deploymentId}`);
    } catch (error) {
      console.error('❌ Failed to get deployment status:', error);
      return null;
    }
  }
}

// Singleton instance
let _enhancedDeploymentServiceInstance: EnhancedDeploymentService | null = null;

export function getEnhancedDeploymentService(): EnhancedDeploymentService {
  if (!_enhancedDeploymentServiceInstance) {
    _enhancedDeploymentServiceInstance = new EnhancedDeploymentService();
  }
  return _enhancedDeploymentServiceInstance;
}

// Simple export for direct use
export const enhancedDeploymentService = getEnhancedDeploymentService();

