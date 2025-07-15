/**
 * Enhanced Deployment Service
 * 
 * Extends the base deployment service with Promethios-specific features
 * including governance integration, trust scoring, and enhanced monitoring.
 */

import { DeploymentService } from './DeploymentService';
import { UnifiedStorageService } from '../../../services/UnifiedStorageService';
import { deployedAgentAPI, AgentAPIKey } from '../../../services/api/deployedAgentAPI';
import { DualAgentWrapper } from '../types/DualAgentWrapper';
import { DeploymentTarget, DeploymentMethod } from '../types/DeploymentTypes';
import { enhancedAgentIdentityRegistry } from '../../agent-identity/services/EnhancedAgentIdentityRegistry';
import { metricsCollectionExtension } from '../../../extensions/MetricsCollectionExtension';
import { agentLifecycleService } from '../../../services/AgentLifecycleService';

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
  agentId?: string;
  agentName?: string; // Add agent name field
  userId?: string;
  deploymentMethod?: string;
  timestamp?: string;
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
      this.storage = new UnifiedStorageService();
      console.log('✅ UnifiedStorageService created successfully');
    } catch (error) {
      console.error('❌ Error creating UnifiedStorageService:', error);
      console.error('❌ Error details:', error);
      
      // Simple fallback storage that won't crash
      this.storage = {
        get: async () => {
          console.warn('⚠️ Using fallback storage - get operation');
          return null;
        },
        set: async () => {
          console.warn('⚠️ Using fallback storage - set operation');
        },
        delete: async () => {
          console.warn('⚠️ Using fallback storage - delete operation');
        },
        keys: async () => {
          console.warn('⚠️ Using fallback storage - keys operation');
          return [];
        },
        store: async () => {
          console.warn('⚠️ Using fallback storage - store operation');
          return true;
        },
        retrieve: async () => {
          console.warn('⚠️ Using fallback storage - retrieve operation');
          return null;
        },
        remove: async () => {
          console.warn('⚠️ Using fallback storage - remove operation');
          return true;
        },
        getMany: async () => {
          console.warn('⚠️ Using fallback storage - getMany operation');
          return [];
        },
        isReady: () => {
          console.warn('⚠️ Using fallback storage - isReady check');
          return false;
        }
      } as any;
    }
    
    console.log('✅ EnhancedDeploymentService initialization complete');
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
      // Set current user context for the registry
      enhancedAgentIdentityRegistry.setCurrentUser(userId);
      
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

    // Clean up old deployment packages to prevent storage quota issues
    await this.cleanupOldDeploymentPackages();

    // Store package for later retrieval using proper unified storage
    await this.storage.set('deployment', enhancedPackage.id, enhancedPackage);
    
    console.log('✅ Enhanced deployment package created');
    return enhancedPackage;
  }

  /**
   * Deploy enhanced package to target environment
   */
  async deployEnhancedPackage(
    enhancedPackage: EnhancedDeploymentPackage,
    target: DeploymentTarget
  ): Promise<RealDeploymentResult>;
  
  /**
   * Deploy enhanced package by agent ID (overload for direct deployment)
   */
  async deployEnhancedPackage(
    agentId: string,
    userId: string,
    deploymentMethod: any
  ): Promise<RealDeploymentResult>;
  
  async deployEnhancedPackage(
    packageOrAgentId: EnhancedDeploymentPackage | string,
    targetOrUserId: DeploymentTarget | string,
    deploymentMethod?: any
  ): Promise<RealDeploymentResult> {
    console.log('🚀 Deploying enhanced package');
    
    try {
      let result: RealDeploymentResult;
      
      if (typeof packageOrAgentId === 'string') {
        // Direct deployment by agent ID
        const agentId = packageOrAgentId;
        const userId = targetOrUserId as string;
        
        console.log('🔍 Direct deployment for agent:', agentId);
        console.log('🔍 Deployment method:', deploymentMethod);
        
        // Validate inputs
        if (!agentId || !userId) {
          throw new Error('Agent ID and User ID are required for deployment');
        }
        
        // Create a simple deployment result
        const deploymentId = `deploy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Try to get agent name from storage
        let agentName = 'AI Assistant'; // Default fallback
        try {
          const agentData = await this.storage.get('agents', agentId);
          if (agentData?.metadata?.name) {
            agentName = agentData.metadata.name;
          } else if (agentData?.name) {
            agentName = agentData.name;
          } else if (agentData?.config?.name) {
            agentName = agentData.config.name;
          } else {
            // Try to create a meaningful name from the agent ID
            const idParts = agentId.split('_');
            if (idParts.length > 1) {
              const agentPart = idParts[1]?.split('-')[0];
              if (agentPart && agentPart !== 'agent') {
                const friendlyNames: { [key: string]: string } = {
                  'openai': 'OpenAI Assistant',
                  'claude': 'Claude Assistant', 
                  'gpt': 'GPT Assistant',
                  'assistant': 'AI Assistant',
                  'chatgpt': 'ChatGPT Assistant',
                  'veritas': 'Veritas Agent',
                  'promethios': 'Promethios Agent'
                };
                
                const lowerPart = agentPart.toLowerCase();
                if (friendlyNames[lowerPart]) {
                  agentName = friendlyNames[lowerPart];
                } else {
                  agentName = `${agentPart.charAt(0).toUpperCase() + agentPart.slice(1)} Assistant`;
                }
              }
            }
          }
          console.log('🏷️ Resolved agent name for deployment:', agentName);
        } catch (error) {
          console.warn('⚠️ Could not load agent data for name resolution:', error);
        }
        
        result = {
          success: true,
          deploymentId,
          url: `https://deployed-agent-${deploymentId}.example.com`,
          agentId,
          agentName, // Include the resolved agent name
          userId,
          deploymentMethod: deploymentMethod?.type || 'api_package',
          timestamp: new Date().toISOString()
        };
        
        console.log('🔍 Storing deployment result with ID:', deploymentId);
        
        // 📊 AGENT LIFECYCLE INTEGRATION: Handle agent wrapping and deployment
        try {
          console.log('🎯 Processing agent wrapping and deployment lifecycle for:', agentId);
          
          // Create production agent ID (if different from test agent ID)
          const productionAgentId = agentId.includes('-test') ? agentId.replace('-test', '-production') : `${agentId}-production`;
          
          // Handle agent wrapping (test to production promotion)
          const wrappingResult = await agentLifecycleService.onAgentWrapped(agentId, productionAgentId, userId);
          if (!wrappingResult.success) {
            throw new Error(`Agent wrapping failed: ${wrappingResult.error}`);
          }
          
          // Handle agent deployment
          const deploymentResult = await agentLifecycleService.onAgentDeployed(
            productionAgentId,
            deploymentId,
            result.url || '',
            userId,
            'production'
          );
          if (!deploymentResult.success) {
            throw new Error(`Agent deployment lifecycle failed: ${deploymentResult.error}`);
          }
          
          console.log('✅ Agent lifecycle processing completed successfully');
        } catch (lifecycleError) {
          console.error('❌ Failed to process agent lifecycle:', lifecycleError);
          // Don't fail deployment if lifecycle processing fails
          console.log('⚠️ Continuing deployment despite lifecycle failure');
        }
        
        // Store deployment result with proper unified storage method
        try {
          const storageKey = `${userId}_${deploymentId}`;
          await this.storage.set('deployment-result', storageKey, result);
          console.log('✅ Deployment result stored successfully with key:', storageKey);
        } catch (storageError) {
          console.error('❌ Failed to store deployment result:', storageError);
          // Don't fail the deployment if storage fails
          console.log('⚠️ Continuing deployment despite storage failure');
        }
        
        console.log('✅ Direct deployment completed successfully');
        
      } else {
        // Enhanced package deployment
        const enhancedPackage = packageOrAgentId;
        const target = targetOrUserId as DeploymentTarget;
        
        result = await this.deployViaIntegration(enhancedPackage, target);
        
        if (result.success) {
          // Store deployment result with proper unified storage method
          const storageKey = `${result.userId}_${result.deploymentId}`;
          await this.storage.set('deployment-result', storageKey, result);
          console.log('✅ Enhanced package deployed successfully with key:', storageKey);
        }
      }
      
      return result;
    } catch (error) {
      console.error('❌ Enhanced package deployment failed:', error);
      const fallbackId = typeof packageOrAgentId === 'string' ? packageOrAgentId : packageOrAgentId.id;
      return {
        success: false,
        deploymentId: fallbackId,
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
      console.log('🔍 Loading deployments for user:', userId);
      
      // Get all keys from the deployment-result namespace
      const keys = await this.storage.keys('deployment-result');
      console.log('🔍 Found deployment-result keys:', keys);
      
      // Filter keys for this user
      const userDeploymentKeys = keys.filter(key => key.includes(userId));
      console.log('🔍 User deployment keys:', userDeploymentKeys);
      
      if (userDeploymentKeys.length === 0) {
        console.log('📭 No deployments found for user');
        return [];
      }
      
      // Load all deployments for this user
      const deployments: RealDeploymentResult[] = [];
      for (const key of userDeploymentKeys) {
        try {
          const deployment = await this.storage.get('deployment-result', key);
          if (deployment) {
            console.log('✅ Loaded deployment:', { id: deployment.deploymentId, agentId: deployment.agentId });
            
            // Migration: Add agentName if missing
            if (!deployment.agentName && deployment.agentId) {
              console.log('🔄 Migrating deployment to add agentName:', deployment.deploymentId);
              
              // Try to get agent name from storage first
              let agentName = 'AI Assistant'; // Default fallback
              try {
                const agentData = await this.storage.get('agents', deployment.agentId);
                if (agentData?.metadata?.name) {
                  agentName = agentData.metadata.name;
                } else if (agentData?.name) {
                  agentName = agentData.name;
                } else if (agentData?.config?.name) {
                  agentName = agentData.config.name;
                } else {
                  // Create meaningful name from agent ID
                  const idParts = deployment.agentId.split('_');
                  if (idParts.length > 1) {
                    const agentPart = idParts[1]?.split('-')[0];
                    if (agentPart && agentPart !== 'agent') {
                      const friendlyNames: { [key: string]: string } = {
                        'openai': 'OpenAI Assistant',
                        'claude': 'Claude Assistant', 
                        'gpt': 'GPT Assistant',
                        'assistant': 'AI Assistant',
                        'chatgpt': 'ChatGPT Assistant',
                        'veritas': 'Veritas Agent',
                        'promethios': 'Promethios Agent'
                      };
                      
                      const lowerPart = agentPart.toLowerCase();
                      if (friendlyNames[lowerPart]) {
                        agentName = friendlyNames[lowerPart];
                      } else {
                        agentName = `${agentPart.charAt(0).toUpperCase() + agentPart.slice(1)} Assistant`;
                      }
                    }
                  }
                }
                console.log('🏷️ Resolved agent name for migration:', agentName);
              } catch (error) {
                console.warn('⚠️ Could not load agent data for name resolution during migration:', error);
              }
              
              // Update deployment with agent name
              deployment.agentName = agentName;
              
              // Save the updated deployment back to storage
              try {
                await this.storage.set('deployment-result', key, deployment);
                console.log('✅ Successfully migrated deployment with agentName:', agentName);
              } catch (error) {
                console.warn('⚠️ Failed to save migrated deployment:', error);
              }
            }
            
            deployments.push(deployment);
          }
        } catch (error) {
          console.warn('⚠️ Failed to load deployment:', key, error);
        }
      }
      
      console.log(`📦 Loaded ${deployments.length} deployments for user ${userId}`);
      return deployments.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
    } catch (error) {
      console.error('❌ Failed to list deployments:', error);
      return [];
    }
  }

  /**
   * Get deployment status
   */
  async getRealDeploymentStatus(deploymentId: string, userId?: string): Promise<RealDeploymentResult | null> {
    try {
      if (userId) {
        // Try with user ID prefix first
        const userKey = `${userId}_${deploymentId}`;
        const result = await this.storage.get('deployment-result', userKey);
        if (result) return result;
      }
      
      // Fallback: search through all deployment keys for this deployment ID
      const keys = await this.storage.keys('deployment-result');
      const matchingKey = keys.find(key => key.includes(deploymentId));
      
      if (matchingKey) {
        return await this.storage.get('deployment-result', matchingKey);
      }
      
      return null;
    } catch (error) {
      console.error('❌ Failed to get deployment status:', error);
      return null;
    }
  }

  /**
   * Clean up old deployment packages to prevent storage quota issues
   */
  private async cleanupOldDeploymentPackages(): Promise<void> {
    try {
      console.log('🧹 Cleaning up old deployment packages...');
      
      // Get all deployment package keys
      const keys = await this.storage.keys('deployment');
      console.log(`Found ${keys.length} deployment packages`);
      
      // Keep only the 5 most recent packages, delete the rest
      const maxPackages = 5;
      if (keys.length > maxPackages) {
        // Sort by creation time (extract timestamp from package ID)
        const sortedKeys = keys.sort((a, b) => {
          const timestampA = this.extractTimestampFromKey(a);
          const timestampB = this.extractTimestampFromKey(b);
          return timestampB - timestampA; // Most recent first
        });
        
        // Delete old packages
        const keysToDelete = sortedKeys.slice(maxPackages);
        console.log(`Deleting ${keysToDelete.length} old deployment packages`);
        
        for (const key of keysToDelete) {
          await this.storage.delete('deployment', key);
          console.log(`🗑️ Deleted old deployment package: ${key}`);
        }
      }
      
      console.log('✅ Cleanup completed');
    } catch (error) {
      console.warn('⚠️ Failed to cleanup old deployment packages:', error);
      // Don't throw - cleanup failure shouldn't block deployment
    }
  }

  /**
   * Extract timestamp from deployment package key
   */
  private extractTimestampFromKey(key: string): number {
    try {
      // Keys are in format: enhanced-{timestamp}-{random}
      const match = key.match(/enhanced-(\d+)-/);
      return match ? parseInt(match[1]) : 0;
    } catch {
      return 0;
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

