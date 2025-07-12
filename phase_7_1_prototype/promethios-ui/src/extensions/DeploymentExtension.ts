/**
 * Deployment Extension for Promethios
 * 
 * Provides deployment functionality following the existing extension pattern
 */

import { EnhancedDeploymentService } from '../modules/agent-wrapping/services/EnhancedDeploymentService';
import { DualAgentWrapper } from '../modules/agent-wrapping/types/dualWrapper';
import { DeploymentPackage, DeploymentTarget, DeploymentStatus } from '../modules/agent-wrapping/services/DeploymentService';
import { UnifiedStorageService } from '../services/UnifiedStorageService';
import { deployedAgentAPI } from '../services/api/deployedAgentAPI';

export interface DeploymentConfig {
  target: DeploymentTarget;
  environment: Record<string, string>;
  resources?: {
    cpu?: string;
    memory?: string;
    storage?: string;
  };
  scaling?: {
    minReplicas?: number;
    maxReplicas?: number;
    targetCPU?: number;
  };
  networking?: {
    port?: number;
    protocol?: 'http' | 'https';
    domain?: string;
  };
}

export interface DeploymentResult {
  deploymentId: string;
  status: DeploymentStatus;
  endpoint?: string;
  apiKey: string;
  artifacts: string[];
  instructions: string[];
  monitoringUrl?: string;
}

export interface DeploymentMetrics {
  deploymentId: string;
  status: DeploymentStatus;
  health: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  lastHeartbeat?: Date;
  uptime?: number;
  requestCount?: number;
  errorRate?: number;
  responseTime?: number;
}

/**
 * Deployment Extension Class
 * Provides deployment-related functionality as a service following extension pattern
 */
export class DeploymentExtension {
  private static instance: DeploymentExtension;
  private initialized = false;
  private deploymentService: EnhancedDeploymentService;
  private storage: UnifiedStorageService;

  private constructor() {
    this.deploymentService = new EnhancedDeploymentService();
    this.storage = new UnifiedStorageService();
  }

  static getInstance(): DeploymentExtension {
    if (!DeploymentExtension.instance) {
      DeploymentExtension.instance = new DeploymentExtension();
    }
    return DeploymentExtension.instance;
  }

  async initialize(): Promise<boolean> {
    if (this.initialized) {
      return true;
    }

    try {
      // Storage is already initialized in constructor
      // Initialize deployment service
      // Note: EnhancedDeploymentService extends existing DeploymentService
      
      this.initialized = true;
      console.log('DeploymentExtension initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize DeploymentExtension:', error);
      return false;
    }
  }

  // Extension point: Before deployment
  async beforeDeploy(userId: string, wrapper: DualAgentWrapper, config: DeploymentConfig): Promise<void> {
    console.log(`Before deploy: ${wrapper.deploymentWrapper.id} for user ${userId}`);
    
    // Validate deployment configuration
    await this.validateDeploymentConfig(config);
    
    // Log deployment attempt
    await this.storage.set('deployment_audit', `before_${Date.now()}`, {
      userId,
      wrapperId: wrapper.deploymentWrapper.id,
      config,
      timestamp: new Date()
    });
  }

  // Extension point: After deployment
  async afterDeploy(userId: string, wrapper: DualAgentWrapper, result: DeploymentResult): Promise<void> {
    console.log(`After deploy: ${result.deploymentId} with status ${result.status}`);
    
    // Store deployment result
    await this.storage.set('deployments', result.deploymentId, {
      ...result,
      userId,
      wrapperId: wrapper.deploymentWrapper.id,
      createdAt: new Date()
    });
    
    // Log successful deployment
    await this.storage.set('deployment_audit', `after_${Date.now()}`, {
      userId,
      deploymentId: result.deploymentId,
      status: result.status,
      timestamp: new Date()
    });
  }

  // Extension point: Before undeploy
  async beforeUndeploy(userId: string, deploymentId: string): Promise<void> {
    console.log(`Before undeploy: ${deploymentId} for user ${userId}`);
    
    // Log undeploy attempt
    await this.storage.set('deployment_audit', `before_undeploy_${Date.now()}`, {
      userId,
      deploymentId,
      action: 'undeploy',
      timestamp: new Date()
    });
  }

  // Extension point: After undeploy
  async afterUndeploy(userId: string, deploymentId: string): Promise<void> {
    console.log(`After undeploy: ${deploymentId}`);
    
    // Update deployment status
    const deployment = await this.storage.get('deployments', deploymentId);
    if (deployment) {
      deployment.status = 'stopped';
      deployment.stoppedAt = new Date();
      await this.storage.set('deployments', deploymentId, deployment);
    }
    
    // Log successful undeploy
    await this.storage.set('deployment_audit', `after_undeploy_${Date.now()}`, {
      userId,
      deploymentId,
      action: 'undeploy',
      timestamp: new Date()
    });
  }

  // Extension point: On deployment error
  async onDeploymentError(userId: string, error: Error, context: any): Promise<void> {
    console.error(`Deployment error for user ${userId}:`, error);
    
    // Log deployment error
    await this.storage.set('deployment_errors', `error_${Date.now()}`, {
      userId,
      error: error.message,
      stack: error.stack,
      context,
      timestamp: new Date()
    });
  }

  // Extension point: On metrics update
  async onMetricsUpdate(deploymentId: string, metrics: DeploymentMetrics): Promise<void> {
    console.log(`Metrics update for deployment ${deploymentId}:`, metrics);
    
    // Store latest metrics
    await this.storage.set('deployment_metrics', deploymentId, {
      ...metrics,
      lastUpdated: new Date()
    });
    
    // Check for health issues and trigger alerts if needed
    if (metrics.health === 'unhealthy' || metrics.health === 'degraded') {
      await this.triggerHealthAlert(deploymentId, metrics);
    }
  }

  // Core deployment methods
  async deployAgent(userId: string, wrapper: DualAgentWrapper, config: DeploymentConfig): Promise<DeploymentResult> {
    try {
      // Before deploy extension point
      await this.beforeDeploy(userId, wrapper, config);
      
      // Generate deployment package
      const deploymentPackage = await this.deploymentService.createDeploymentPackage(
        wrapper.deploymentWrapper,
        config.target,
        {
          environment: config.environment,
          resources: config.resources,
          scaling: config.scaling,
          networking: config.networking
        }
      );
      
      // Generate API key for this deployment
      const apiKey = await deployedAgentAPI.generateAPIKey(userId, wrapper.deploymentWrapper.id);
      
      // Create deployment result
      const result: DeploymentResult = {
        deploymentId: `deploy_${wrapper.deploymentWrapper.id}_${Date.now()}`,
        status: 'pending',
        apiKey,
        artifacts: deploymentPackage.artifacts.map(a => a.path),
        instructions: deploymentPackage.instructions,
        endpoint: config.networking?.domain ? 
          `${config.networking.protocol || 'https'}://${config.networking.domain}` : 
          undefined,
        monitoringUrl: `${import.meta.env.VITE_API_URL}/deployments/${result.deploymentId}/metrics`
      };
      
      // After deploy extension point
      await this.afterDeploy(userId, wrapper, result);
      
      return result;
      
    } catch (error) {
      await this.onDeploymentError(userId, error as Error, { wrapper, config });
      throw error;
    }
  }

  // NEW: Production deployment method
  async deployToProduction(userId: string, agentId: string, deploymentType: 'api-package' | 'cloud-package'): Promise<DeploymentResult> {
    try {
      console.log(`🚀 Starting production deployment for agent ${agentId}`);
      
      // Get agent wrapper from storage
      const wrapper = await this.storage.get<DualAgentWrapper>('agent_wrappers', agentId);
      if (!wrapper) {
        throw new Error(`Agent wrapper not found: ${agentId}`);
      }

      // Create production deployment configuration
      const config: DeploymentConfig = {
        target: deploymentType === 'api-package' ? 'api' : 'cloud',
        environment: {
          NODE_ENV: 'production',
          AGENT_ID: agentId,
          USER_ID: userId,
          DEPLOYMENT_TYPE: deploymentType
        },
        resources: {
          cpu: '1000m',
          memory: '2Gi',
          storage: '10Gi'
        },
        scaling: {
          minReplicas: 1,
          maxReplicas: 5,
          targetCPU: 70
        },
        networking: {
          port: 8080,
          protocol: 'https'
        }
      };

      // Call the deployment API
      const deploymentResponse = await fetch(`${import.meta.env.VITE_DEPLOYMENT_API_URL || 'http://localhost:5001'}/v1/agents/deploy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agentId,
          deploymentType,
          environment: 'production',
          userId
        })
      });

      if (!deploymentResponse.ok) {
        throw new Error(`Deployment API error: ${deploymentResponse.status} ${deploymentResponse.statusText}`);
      }

      const deploymentData = await deploymentResponse.json();
      
      // Generate API key
      const apiKey = await deployedAgentAPI.generateAPIKey(userId, agentId);
      
      // Create enhanced deployment result
      const result: DeploymentResult = {
        deploymentId: deploymentData.deploymentId || `prod_${agentId}_${Date.now()}`,
        status: 'deploying',
        apiKey,
        artifacts: deploymentData.artifacts || [],
        instructions: deploymentData.instructions || [
          'Deployment initiated successfully',
          'Monitor deployment status in real-time',
          'API key generated for agent access'
        ],
        endpoint: deploymentData.endpoint,
        monitoringUrl: `${import.meta.env.VITE_DEPLOYMENT_API_URL}/v1/deployments/${deploymentData.deploymentId}/status`
      };

      // Store deployment record
      await this.storage.set('production_deployments', result.deploymentId, {
        ...result,
        userId,
        agentId,
        deploymentType,
        createdAt: new Date(),
        lastUpdated: new Date()
      });

      // After deploy extension point
      await this.afterDeploy(userId, wrapper, result);
      
      console.log(`✅ Production deployment initiated: ${result.deploymentId}`);
      return result;
      
    } catch (error) {
      console.error(`❌ Production deployment failed for agent ${agentId}:`, error);
      await this.onDeploymentError(userId, error as Error, { agentId, deploymentType });
      throw error;
    }
  }

  // NEW: Restart agent method
  async restartAgent(userId: string, deploymentId: string): Promise<{ success: boolean; message: string }> {
    try {
      console.log(`🔄 Restarting deployment ${deploymentId}`);
      
      // Call the deployment API restart endpoint
      const response = await fetch(`${import.meta.env.VITE_DEPLOYMENT_API_URL || 'http://localhost:5001'}/v1/agents/${deploymentId}/restart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId })
      });

      if (!response.ok) {
        throw new Error(`Restart API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      // Update deployment status
      await this.updateDeploymentMetrics(deploymentId, {
        status: 'restarting',
        lastHeartbeat: new Date()
      });

      // Log restart action
      await this.storage.set('deployment_audit', `restart_${Date.now()}`, {
        userId,
        deploymentId,
        action: 'restart',
        timestamp: new Date()
      });

      console.log(`✅ Agent restart initiated: ${deploymentId}`);
      return {
        success: true,
        message: result.message || 'Agent restart initiated successfully'
      };
      
    } catch (error) {
      console.error(`❌ Failed to restart agent ${deploymentId}:`, error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // NEW: Get system-wide deployment metrics
  async getSystemWideMetrics(): Promise<{
    totalDeployments: number;
    activeDeployments: number;
    failedDeployments: number;
    successRate: number;
    averageResponseTime: number;
    systemHealth: 'healthy' | 'degraded' | 'unhealthy';
  }> {
    try {
      // Call the deployment API metrics endpoint
      const response = await fetch(`${import.meta.env.VITE_DEPLOYMENT_API_URL || 'http://localhost:5001'}/v1/deployments/metrics`);
      
      if (!response.ok) {
        throw new Error(`Metrics API error: ${response.status}`);
      }

      const metrics = await response.json();
      
      // Cache metrics locally
      await this.storage.set('system_metrics', 'latest', {
        ...metrics,
        lastUpdated: new Date()
      });

      return metrics;
      
    } catch (error) {
      console.error('Failed to get system-wide metrics:', error);
      
      // Return cached metrics if available
      const cached = await this.storage.get('system_metrics', 'latest');
      if (cached) {
        return cached;
      }
      
      // Return default metrics if no cache available
      return {
        totalDeployments: 0,
        activeDeployments: 0,
        failedDeployments: 0,
        successRate: 0,
        averageResponseTime: 0,
        systemHealth: 'unknown' as const
      };
    }
  }

  // NEW: Get system alerts
  async getSystemAlerts(): Promise<Array<{
    id: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    deploymentId?: string;
    timestamp: Date;
    resolved: boolean;
  }>> {
    try {
      // Call the deployment API alerts endpoint
      const response = await fetch(`${import.meta.env.VITE_DEPLOYMENT_API_URL || 'http://localhost:5001'}/v1/deployments/alerts`);
      
      if (!response.ok) {
        throw new Error(`Alerts API error: ${response.status}`);
      }

      const alerts = await response.json();
      
      // Cache alerts locally
      await this.storage.set('system_alerts', 'latest', {
        alerts,
        lastUpdated: new Date()
      });

      return alerts;
      
    } catch (error) {
      console.error('Failed to get system alerts:', error);
      
      // Return cached alerts if available
      const cached = await this.storage.get('system_alerts', 'latest');
      if (cached && cached.alerts) {
        return cached.alerts;
      }
      
      return [];
    }
  }

  // NEW: Get deployment history for analytics
  async getDeploymentHistory(userId?: string, limit: number = 50): Promise<Array<{
    deploymentId: string;
    agentId: string;
    userId: string;
    status: DeploymentStatus;
    createdAt: Date;
    completedAt?: Date;
    duration?: number;
    deploymentType: string;
  }>> {
    try {
      const allDeployments = await this.storage.getMany('production_deployments', []);
      
      let deployments = allDeployments.filter(d => d !== null);
      
      // Filter by user if specified
      if (userId) {
        deployments = deployments.filter(d => d.userId === userId);
      }
      
      // Sort by creation date (newest first)
      deployments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      // Limit results
      deployments = deployments.slice(0, limit);
      
      // Transform to history format
      return deployments.map(d => ({
        deploymentId: d.deploymentId,
        agentId: d.agentId,
        userId: d.userId,
        status: d.status,
        createdAt: new Date(d.createdAt),
        completedAt: d.completedAt ? new Date(d.completedAt) : undefined,
        duration: d.completedAt && d.createdAt ? 
          new Date(d.completedAt).getTime() - new Date(d.createdAt).getTime() : undefined,
        deploymentType: d.deploymentType
      }));
      
    } catch (error) {
      console.error('Failed to get deployment history:', error);
      return [];
    }
  }

  async undeployAgent(userId: string, deploymentId: string): Promise<void> {
    try {
      // Before undeploy extension point
      await this.beforeUndeploy(userId, deploymentId);
      
      // Get deployment info
      const deployment = await this.storage.get('deployments', deploymentId);
      if (!deployment) {
        throw new Error(`Deployment ${deploymentId} not found`);
      }
      
      // Revoke API key
      await deployedAgentAPI.revokeAPIKey(deployment.apiKey);
      
      // After undeploy extension point
      await this.afterUndeploy(userId, deploymentId);
      
    } catch (error) {
      await this.onDeploymentError(userId, error as Error, { deploymentId });
      throw error;
    }
  }

  async getDeploymentStatus(userId: string, deploymentId: string): Promise<DeploymentMetrics | null> {
    try {
      const metrics = await this.storage.get<DeploymentMetrics>('deployment_metrics', deploymentId);
      return metrics || null;
    } catch (error) {
      console.error(`Failed to get deployment status for ${deploymentId}:`, error);
      return null;
    }
  }

  async listUserDeployments(userId: string): Promise<DeploymentResult[]> {
    try {
      const allDeployments = await this.storage.getMany('deployments', []);
      return allDeployments.filter(d => d && d.userId === userId);
    } catch (error) {
      console.error(`Failed to list deployments for user ${userId}:`, error);
      return [];
    }
  }

  async updateDeploymentMetrics(deploymentId: string, metrics: Partial<DeploymentMetrics>): Promise<void> {
    try {
      const existing = await this.storage.get<DeploymentMetrics>('deployment_metrics', deploymentId);
      const updated = {
        ...existing,
        ...metrics,
        deploymentId,
        lastUpdated: new Date()
      };
      
      await this.storage.set('deployment_metrics', deploymentId, updated);
      
      // Trigger metrics update extension point
      await this.onMetricsUpdate(deploymentId, updated as DeploymentMetrics);
      
    } catch (error) {
      console.error(`Failed to update metrics for deployment ${deploymentId}:`, error);
    }
  }

  // Utility methods
  private async validateDeploymentConfig(config: DeploymentConfig): Promise<void> {
    if (!config.target) {
      throw new Error('Deployment target is required');
    }
    
    if (config.networking?.port && (config.networking.port < 1 || config.networking.port > 65535)) {
      throw new Error('Invalid port number');
    }
    
    if (config.scaling?.minReplicas && config.scaling?.maxReplicas && 
        config.scaling.minReplicas > config.scaling.maxReplicas) {
      throw new Error('Min replicas cannot be greater than max replicas');
    }
  }

  private async triggerHealthAlert(deploymentId: string, metrics: DeploymentMetrics): Promise<void> {
    // This would integrate with your notification system
    console.warn(`Health alert for deployment ${deploymentId}: ${metrics.health}`);
    
    // Store alert
    await this.storage.set('deployment_alerts', `alert_${deploymentId}_${Date.now()}`, {
      deploymentId,
      health: metrics.health,
      metrics,
      timestamp: new Date()
    });
  }

  // Getter methods
  getDeploymentService(): EnhancedDeploymentService {
    return this.deploymentService;
  }

  getStorageService(): UnifiedStorageService {
    return this.storage;
  }

  isInitialized(): boolean {
    return this.initialized;
  }
}

// Export singleton instance
export const deploymentExtension = DeploymentExtension.getInstance();

