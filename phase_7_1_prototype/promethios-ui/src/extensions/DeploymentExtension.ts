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
      // Initialize storage
      await this.storage.initialize();
      
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

