/**
 * Deployment Integration Service
 * Enhanced with retry logic for handling service cold starts
 */

import { retryDeploymentAPI } from '../utils/apiRetry';
import { DEPLOYMENT_API } from '../config/api';

export interface DeploymentRequest {
  agentId: string;
  deploymentType: 'api-package' | 'cloud-package';
  environment: 'production' | 'staging';
  configuration?: any;
}

export interface DeploymentResponse {
  success: boolean;
  deploymentId: string;
  agentId: string;
  status: string;
  endpoint?: string;
  apiKey?: string;
  error?: string;
}

export interface DeploymentStatus {
  deploymentId: string;
  agentId: string;
  status: 'pending' | 'deploying' | 'deployed' | 'failed';
  healthStatus?: 'healthy' | 'warning' | 'critical';
  lastHeartbeat?: string;
  metrics?: any;
}

export class DeploymentIntegrationService {
  /**
   * Deploy an agent with retry logic for cold starts
   */
  async deployAgent(request: DeploymentRequest): Promise<DeploymentResponse> {
    try {
      console.log(`🚀 Deploying agent ${request.agentId} with retry logic`);
      
      const response = await retryDeploymentAPI<DeploymentResponse>(
        `${DEPLOYMENT_API.BASE}/v1/agents/deploy`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request)
        }
      );

      console.log(`✅ Agent ${request.agentId} deployed successfully:`, response);
      return response;
    } catch (error) {
      console.error(`❌ Failed to deploy agent ${request.agentId}:`, error);
      throw error;
    }
  }

  /**
   * Get deployment status with retry logic
   */
  async getDeploymentStatus(agentId: string): Promise<DeploymentStatus> {
    try {
      console.log(`📊 Getting deployment status for agent ${agentId}`);
      
      const response = await retryDeploymentAPI<any>(
        `${DEPLOYMENT_API.BASE}/v1/agents/${agentId}/deployment-status`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      console.log(`✅ Got deployment status for agent ${agentId}:`, response);
      
      return {
        deploymentId: response.deploymentStatus?.deploymentId || `deploy-${agentId}`,
        agentId: agentId,
        status: response.deploymentStatus?.status || 'deployed',
        healthStatus: response.deploymentStatus?.healthStatus || 'healthy',
        lastHeartbeat: response.deploymentStatus?.lastHeartbeat,
        metrics: response.deploymentStatus
      };
    } catch (error) {
      console.error(`❌ Failed to get deployment status for agent ${agentId}:`, error);
      throw error;
    }
  }

  /**
   * Generate API key for deployed agent with retry logic
   */
  async generateAPIKey(agentId: string): Promise<{ apiKey: string; agentId: string }> {
    try {
      console.log(`🔑 Generating API key for agent ${agentId} with retry logic`);
      
      const response = await retryDeploymentAPI<any>(
        `${DEPLOYMENT_API.BASE}/v1/agents/${agentId}/api-key`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            permissions: ['chat', 'deploy', 'monitor']
          })
        }
      );

      console.log(`✅ API key generated for agent ${agentId}`);
      
      return {
        apiKey: response.apiKey,
        agentId: agentId
      };
    } catch (error) {
      console.error(`❌ Failed to generate API key for agent ${agentId}:`, error);
      throw error;
    }
  }

  /**
   * Test deployment API connectivity
   */
  async testConnectivity(): Promise<boolean> {
    try {
      console.log('🔍 Testing deployment API connectivity...');
      
      const response = await retryDeploymentAPI<any>(
        `${DEPLOYMENT_API.BASE}/health`,
        {
          method: 'GET',
        }
      );

      console.log('✅ Deployment API is accessible:', response);
      return true;
    } catch (error) {
      console.error('❌ Deployment API connectivity test failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const deploymentIntegrationService = new DeploymentIntegrationService();

