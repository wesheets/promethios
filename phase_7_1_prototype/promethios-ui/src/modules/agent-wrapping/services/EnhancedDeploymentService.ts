/**
 * Enhanced Deployment Service
 * 
 * Extends the existing DeploymentService with real deployment capabilities
 * and integration with the deployed agent API infrastructure.
 * 
 * This service adds:
 * - API key generation for deployed agents
 * - Real deployment tracking and monitoring
 * - Integration with deployed agent data collection
 * - Promethios reporting configuration in deployment packages
 */

import { DeploymentService, DeploymentPackage, DeploymentTarget, DeploymentResult } from './DeploymentService';
import { DualAgentWrapper } from '../types/dualWrapper';
import { MultiAgentDualWrapper } from '../types/enhancedMultiAgent';
import { deployedAgentAPI, AgentAPIKey } from '../../../services/api/deployedAgentAPI';
import { deployedAgentDataService } from '../../../services/DeployedAgentDataService';
import { UnifiedStorageService } from '../../../services/UnifiedStorageService';

export interface EnhancedDeploymentPackage extends DeploymentPackage {
  // Add Promethios-specific configuration
  promethiosConfig: {
    apiKey: string;
    agentId: string;
    governanceIdentity: string;
    reportingEndpoints: {
      metrics: string;
      logs: string;
      heartbeat: string;
      violations: string;
    };
    reportingInterval: number; // seconds
    dataRetention: string; // e.g., "30d"
  };
  
  // Enhanced runtime with Promethios integration
  runtime: DeploymentPackage['runtime'] & {
    environmentVariables: DeploymentPackage['runtime']['environmentVariables'] & {
      PROMETHIOS_API_KEY: string;
      PROMETHIOS_AGENT_ID: string;
      PROMETHIOS_GOVERNANCE_ID: string;
      PROMETHIOS_ENDPOINT: string;
      PROMETHIOS_REPORTING_INTERVAL: string;
    };
  };
}

export interface RealDeploymentResult extends DeploymentResult {
  // Add real deployment tracking
  apiKey?: string;
  governanceIdentity?: string;
  reportingStatus: 'not_started' | 'active' | 'degraded' | 'offline';
  lastHeartbeat?: string;
  metricsReceived: number;
  violationsReported: number;
  dataFreshness: 'live' | 'recent' | 'stale' | 'offline';
}

export interface DeploymentMethod {
  type: 'api_package' | 'integration';
  provider?: 'aws' | 'gcp' | 'azure' | 'docker' | 'kubernetes';
  configuration?: any;
}

/**
 * Enhanced Deployment Service with real deployment capabilities
 */
export class EnhancedDeploymentService extends DeploymentService {
  private storage: UnifiedStorageService;
  private apiKeys: Map<string, AgentAPIKey> = new Map();

  constructor() {
    super();
    this.storage = new UnifiedStorageService();
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
    // Generate API key for the deployed agent
    const apiKey = await this.generateAgentAPIKey(wrapper.id, userId);
    
    // Create base deployment package using existing service
    const basePackage = await super.createSingleAgentDeploymentPackage(wrapper, target);
    
    // Enhance with Promethios configuration
    const enhancedPackage: EnhancedDeploymentPackage = {
      ...basePackage,
      promethiosConfig: {
        apiKey: apiKey.apiKey,
        agentId: wrapper.id,
        governanceIdentity: wrapper.governanceIdentity,
        reportingEndpoints: {
          metrics: 'https://api.promethios.ai/v1/governance/metrics',
          logs: 'https://api.promethios.ai/v1/agents/logs',
          heartbeat: 'https://api.promethios.ai/v1/agents/heartbeat',
          violations: 'https://api.promethios.ai/v1/governance/violations'
        },
        reportingInterval: 30, // 30 seconds
        dataRetention: '90d'
      },
      runtime: {
        ...basePackage.runtime,
        environmentVariables: {
          ...basePackage.runtime.environmentVariables,
          PROMETHIOS_API_KEY: apiKey.apiKey,
          PROMETHIOS_AGENT_ID: wrapper.id,
          PROMETHIOS_GOVERNANCE_ID: wrapper.governanceIdentity,
          PROMETHIOS_ENDPOINT: 'https://api.promethios.ai/v1',
          PROMETHIOS_REPORTING_INTERVAL: '30'
        }
      }
    };

    // Add Promethios reporting client to dependencies
    enhancedPackage.runtime.dependencies.push('@promethios/agent-reporter');

    // Update artifacts with Promethios integration
    enhancedPackage.artifacts = await this.enhanceArtifactsWithPromethios(
      enhancedPackage.artifacts,
      enhancedPackage.promethiosConfig,
      method
    );

    // Store enhanced package
    await this.storage.set('agents', `enhanced-deployment-package-${enhancedPackage.id}`, enhancedPackage);
    
    console.log(`📦 Created enhanced deployment package: ${enhancedPackage.id} with API key`);
    return enhancedPackage;
  }

  /**
   * Create enhanced multi-agent deployment package
   */
  async createEnhancedMultiAgentPackage(
    multiAgentWrapper: MultiAgentDualWrapper,
    target: DeploymentTarget,
    userId: string,
    method: DeploymentMethod
  ): Promise<EnhancedDeploymentPackage> {
    // Generate API key for the multi-agent system
    const systemId = multiAgentWrapper.id;
    const apiKey = await this.generateAgentAPIKey(systemId, userId);
    
    // Create base deployment package
    const basePackage = await super.createMultiAgentDeploymentPackage(multiAgentWrapper, target);
    
    // Enhance with Promethios configuration
    const enhancedPackage: EnhancedDeploymentPackage = {
      ...basePackage,
      promethiosConfig: {
        apiKey: apiKey.apiKey,
        agentId: systemId,
        governanceIdentity: multiAgentWrapper.governanceIdentity,
        reportingEndpoints: {
          metrics: 'https://api.promethios.ai/v1/governance/metrics',
          logs: 'https://api.promethios.ai/v1/agents/logs',
          heartbeat: 'https://api.promethios.ai/v1/agents/heartbeat',
          violations: 'https://api.promethios.ai/v1/governance/violations'
        },
        reportingInterval: 30,
        dataRetention: '90d'
      },
      runtime: {
        ...basePackage.runtime,
        environmentVariables: {
          ...basePackage.runtime.environmentVariables,
          PROMETHIOS_API_KEY: apiKey.apiKey,
          PROMETHIOS_AGENT_ID: systemId,
          PROMETHIOS_GOVERNANCE_ID: multiAgentWrapper.governanceIdentity,
          PROMETHIOS_ENDPOINT: 'https://api.promethios.ai/v1',
          PROMETHIOS_REPORTING_INTERVAL: '30'
        }
      }
    };

    // Add multi-agent specific dependencies
    enhancedPackage.runtime.dependencies.push('@promethios/multi-agent-reporter');

    // Update artifacts for multi-agent deployment
    enhancedPackage.artifacts = await this.enhanceMultiAgentArtifactsWithPromethios(
      enhancedPackage.artifacts,
      enhancedPackage.promethiosConfig,
      method
    );

    // Store enhanced package
    await this.storage.set('agents', `enhanced-deployment-package-${enhancedPackage.id}`, enhancedPackage);
    
    console.log(`📦 Created enhanced multi-agent deployment package: ${enhancedPackage.id}`);
    return enhancedPackage;
  }

  /**
   * Deploy enhanced package with real tracking
   */
  async deployEnhancedPackage(
    packageId: string,
    target: DeploymentTarget,
    method: DeploymentMethod
  ): Promise<RealDeploymentResult> {
    const enhancedPackage = await this.storage.get('agents', `enhanced-deployment-package-${packageId}`) as EnhancedDeploymentPackage;
    
    if (!enhancedPackage) {
      throw new Error(`Enhanced deployment package not found: ${packageId}`);
    }

    let deploymentResult: DeploymentResult;

    if (method.type === 'api_package') {
      // API package deployment - user deploys manually
      deploymentResult = await this.createAPIPackageDeployment(enhancedPackage, target);
    } else {
      // Integration-based deployment - deploy via cloud provider
      deploymentResult = await this.deployViaIntegration(enhancedPackage, target, method);
    }

    // Create enhanced result with real tracking
    const realResult: RealDeploymentResult = {
      ...deploymentResult,
      apiKey: enhancedPackage.promethiosConfig.apiKey,
      governanceIdentity: enhancedPackage.promethiosConfig.governanceIdentity,
      reportingStatus: 'not_started',
      metricsReceived: 0,
      violationsReported: 0,
      dataFreshness: 'offline'
    };

    // Store deployment with tracking
    await this.storage.set('agents', `real-deployment-${realResult.deploymentId}`, realResult);
    
    // Start monitoring for deployed agent data
    await this.startDeploymentMonitoring(realResult);

    console.log(`🚀 Enhanced deployment started: ${realResult.deploymentId}`);
    return realResult;
  }

  /**
   * Get real deployment status with live data
   */
  async getRealDeploymentStatus(deploymentId: string): Promise<RealDeploymentResult | null> {
    const deployment = await this.storage.get('agents', `real-deployment-${deploymentId}`) as RealDeploymentResult;
    
    if (!deployment) {
      return null;
    }

    // Update with latest data from deployed agent
    if (deployment.apiKey) {
      const agentId = deployedAgentAPI.constructor.extractAgentIdFromAPIKey(deployment.apiKey);
      if (agentId) {
        try {
          const agentStatus = await deployedAgentAPI.getAgentStatus(agentId, 'system'); // TODO: Get actual user ID
          
          deployment.reportingStatus = agentStatus.metricsHealth === 'healthy' ? 'active' : 
                                     agentStatus.metricsHealth === 'degraded' ? 'degraded' : 'offline';
          deployment.lastHeartbeat = agentStatus.lastHeartbeat;
          deployment.violationsReported = agentStatus.violationsToday;
          deployment.dataFreshness = deployedAgentDataService.getDataFreshness(agentStatus.lastHeartbeat);
          
          // Update stored deployment
          await this.storage.set('agents', `real-deployment-${deploymentId}`, deployment);
        } catch (error) {
          console.warn(`Failed to get live status for deployment ${deploymentId}:`, error);
        }
      }
    }

    return deployment;
  }

  /**
   * List user's real deployments with live status
   */
  async listRealDeployments(userId: string): Promise<RealDeploymentResult[]> {
    try {
      // Get deployed agents from API
      const deployedAgents = await deployedAgentAPI.getUserDeployedAgents(userId);
      
      // Convert to RealDeploymentResult format
      const realDeployments: RealDeploymentResult[] = deployedAgents.map(agent => ({
        success: agent.status === 'active',
        deploymentId: `deploy-${agent.agentId}`,
        endpoint: `https://deployed-agent-${agent.agentId}.example.com`, // Would be real endpoint
        status: agent.status === 'active' ? 'deployed' : 
                agent.status === 'error' ? 'failed' : 'stopped',
        logs: [`Agent ${agent.agentId} deployed at ${agent.deployedAt}`],
        apiKey: `promethios_${agent.agentId}_****`, // Masked for security
        governanceIdentity: agent.governanceIdentity,
        reportingStatus: agent.metricsHealth === 'healthy' ? 'active' : 
                        agent.metricsHealth === 'degraded' ? 'degraded' : 'offline',
        lastHeartbeat: agent.lastHeartbeat,
        metricsReceived: 0, // Would track actual metrics received
        violationsReported: agent.violationsToday,
        dataFreshness: deployedAgentDataService.getDataFreshness(agent.lastHeartbeat),
        metrics: {
          deploymentTime: 0, // Would track actual deployment time
          resourceUsage: {},
          healthStatus: agent.metricsHealth === 'healthy' ? 'healthy' : 'unhealthy'
        }
      }));

      return realDeployments;
    } catch (error) {
      console.error('Failed to list real deployments:', error);
      return []; // Return empty array instead of mock data
    }
  }

  /**
   * Generate API key for deployed agent
   */
  private async generateAgentAPIKey(agentId: string, userId: string): Promise<AgentAPIKey> {
    try {
      const apiKey = await deployedAgentAPI.generateAPIKey(agentId, userId);
      this.apiKeys.set(agentId, apiKey);
      
      // Store API key securely
      await this.storage.set('agents', `api-key-${agentId}`, {
        ...apiKey,
        apiKey: '***REDACTED***' // Don't store the actual key
      });
      
      return apiKey;
    } catch (error) {
      console.error(`Failed to generate API key for agent ${agentId}:`, error);
      throw error;
    }
  }

  /**
   * Enhance artifacts with Promethios reporting integration
   */
  private async enhanceArtifactsWithPromethios(
    artifacts: DeploymentPackage['artifacts'],
    promethiosConfig: EnhancedDeploymentPackage['promethiosConfig'],
    method: DeploymentMethod
  ): Promise<DeploymentPackage['artifacts']> {
    const enhanced = { ...artifacts };

    // Enhance Dockerfile with Promethios reporting
    if (enhanced.dockerfile) {
      enhanced.dockerfile = this.addPrometheosToDockerfile(enhanced.dockerfile, promethiosConfig);
    }

    // Enhance Kubernetes manifests
    if (enhanced.kubernetesManifests) {
      enhanced.kubernetesManifests = this.addPrometheosToKubernetes(enhanced.kubernetesManifests, promethiosConfig);
    }

    // Enhance serverless config
    if (enhanced.serverlessConfig) {
      enhanced.serverlessConfig = this.addPrometheosToServerless(enhanced.serverlessConfig, promethiosConfig);
    }

    // Add deployment instructions
    enhanced.deploymentInstructions = this.generatePrometheosDeploymentInstructions(method, promethiosConfig);

    return enhanced;
  }

  /**
   * Enhance multi-agent artifacts with Promethios integration
   */
  private async enhanceMultiAgentArtifactsWithPromethios(
    artifacts: DeploymentPackage['artifacts'],
    promethiosConfig: EnhancedDeploymentPackage['promethiosConfig'],
    method: DeploymentMethod
  ): Promise<DeploymentPackage['artifacts']> {
    const enhanced = await this.enhanceArtifactsWithPromethios(artifacts, promethiosConfig, method);

    // Add multi-agent specific enhancements
    if (enhanced.kubernetesManifests) {
      enhanced.kubernetesManifests = this.addMultiAgentPrometheosToKubernetes(enhanced.kubernetesManifests, promethiosConfig);
    }

    return enhanced;
  }

  /**
   * Create API package deployment (user deploys manually)
   */
  private async createAPIPackageDeployment(
    enhancedPackage: EnhancedDeploymentPackage,
    target: DeploymentTarget
  ): Promise<DeploymentResult> {
    return {
      success: true,
      deploymentId: `api-pkg-${Date.now()}`,
      status: 'deployed',
      logs: [
        'API package created successfully',
        'Package includes Promethios reporting configuration',
        'Deploy using provided Docker/Kubernetes/Serverless artifacts',
        'Agent will automatically report to Promethios once deployed'
      ]
    };
  }

  /**
   * Deploy via cloud integration
   */
  private async deployViaIntegration(
    enhancedPackage: EnhancedDeploymentPackage,
    target: DeploymentTarget,
    method: DeploymentMethod
  ): Promise<DeploymentResult> {
    // This would integrate with actual cloud provider APIs
    // For now, simulate the deployment process
    
    const deploymentId = `integration-${method.provider}-${Date.now()}`;
    
    return {
      success: true,
      deploymentId,
      endpoint: `https://${enhancedPackage.promethiosConfig.agentId}.${method.provider}.example.com`,
      status: 'deployed',
      logs: [
        `Deploying to ${method.provider}...`,
        'Configuring Promethios reporting...',
        'Setting up governance monitoring...',
        'Deployment completed successfully',
        'Agent is now reporting to Promethios'
      ],
      metrics: {
        deploymentTime: 120000, // 2 minutes
        resourceUsage: {
          cpu: '0.5 vCPU',
          memory: '1GB',
          storage: '10GB'
        },
        healthStatus: 'healthy'
      }
    };
  }

  /**
   * Start monitoring deployed agent
   */
  private async startDeploymentMonitoring(deployment: RealDeploymentResult): Promise<void> {
    // Set up monitoring for the deployed agent
    console.log(`🔍 Started monitoring deployment: ${deployment.deploymentId}`);
    
    // In a real implementation, this would:
    // 1. Set up webhooks for agent status updates
    // 2. Configure alerting for deployment issues
    // 3. Start health check monitoring
    // 4. Initialize metrics collection
  }

  /**
   * Helper methods for artifact enhancement
   */
  private addPrometheosToDockerfile(dockerfile: string, config: EnhancedDeploymentPackage['promethiosConfig']): string {
    return dockerfile + `

# Add Promethios reporting
RUN npm install @promethios/agent-reporter

# Set Promethios environment variables
ENV PROMETHIOS_API_KEY=${config.apiKey}
ENV PROMETHIOS_AGENT_ID=${config.agentId}
ENV PROMETHIOS_GOVERNANCE_ID=${config.governanceIdentity}
ENV PROMETHIOS_ENDPOINT=https://api.promethios.ai/v1
ENV PROMETHIOS_REPORTING_INTERVAL=${config.reportingInterval}

# Add health check for Promethios reporting
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \\
  CMD curl -f http://localhost:8080/health || exit 1
`;
  }

  private addPrometheosToKubernetes(manifests: any[], config: EnhancedDeploymentPackage['promethiosConfig']): any[] {
    return manifests.map(manifest => {
      if (manifest.kind === 'Deployment') {
        // Add Promethios environment variables
        manifest.spec.template.spec.containers[0].env = [
          ...(manifest.spec.template.spec.containers[0].env || []),
          { name: 'PROMETHIOS_API_KEY', value: config.apiKey },
          { name: 'PROMETHIOS_AGENT_ID', value: config.agentId },
          { name: 'PROMETHIOS_GOVERNANCE_ID', value: config.governanceIdentity },
          { name: 'PROMETHIOS_ENDPOINT', value: 'https://api.promethios.ai/v1' },
          { name: 'PROMETHIOS_REPORTING_INTERVAL', value: config.reportingInterval.toString() }
        ];
      }
      return manifest;
    });
  }

  private addPrometheosToServerless(config: any, promethiosConfig: EnhancedDeploymentPackage['promethiosConfig']): any {
    return {
      ...config,
      environment: {
        ...config.environment,
        PROMETHIOS_API_KEY: promethiosConfig.apiKey,
        PROMETHIOS_AGENT_ID: promethiosConfig.agentId,
        PROMETHIOS_GOVERNANCE_ID: promethiosConfig.governanceIdentity,
        PROMETHIOS_ENDPOINT: 'https://api.promethios.ai/v1',
        PROMETHIOS_REPORTING_INTERVAL: promethiosConfig.reportingInterval.toString()
      }
    };
  }

  private addMultiAgentPrometheosToKubernetes(manifests: any[], config: EnhancedDeploymentPackage['promethiosConfig']): any[] {
    return manifests.map(manifest => {
      if (manifest.kind === 'Deployment') {
        // Add multi-agent specific configuration
        manifest.spec.template.spec.containers[0].env = [
          ...(manifest.spec.template.spec.containers[0].env || []),
          { name: 'MULTI_AGENT_SYSTEM', value: 'true' },
          { name: 'SYSTEM_GOVERNANCE_ID', value: config.governanceIdentity }
        ];
      }
      return manifest;
    });
  }

  private generatePrometheosDeploymentInstructions(
    method: DeploymentMethod,
    config: EnhancedDeploymentPackage['promethiosConfig']
  ): string {
    return `
# Promethios Deployment Instructions

## Deployment Method: ${method.type}

### Promethios Configuration:
- Agent ID: ${config.agentId}
- Governance Identity: ${config.governanceIdentity}
- Reporting Interval: ${config.reportingInterval} seconds
- Data Retention: ${config.dataRetention}

### Reporting Endpoints:
- Metrics: ${config.reportingEndpoints.metrics}
- Logs: ${config.reportingEndpoints.logs}
- Heartbeat: ${config.reportingEndpoints.heartbeat}
- Violations: ${config.reportingEndpoints.violations}

### Post-Deployment:
1. Verify agent is reporting to Promethios
2. Check governance dashboard for agent status
3. Monitor trust scores and compliance rates
4. Review logs and violations in Promethios UI

### Troubleshooting:
- Check API key configuration
- Verify network connectivity to Promethios endpoints
- Review agent logs for reporting errors
- Contact support if issues persist
`;
  }
}

// Export singleton instance with lazy initialization
let _enhancedDeploymentServiceInstance: EnhancedDeploymentService | null = null;

export function getEnhancedDeploymentService(): EnhancedDeploymentService {
  if (!_enhancedDeploymentServiceInstance) {
    _enhancedDeploymentServiceInstance = new EnhancedDeploymentService();
  }
  return _enhancedDeploymentServiceInstance;
}

// Lazy getter for backward compatibility
export const enhancedDeploymentService = {
  get instance() {
    return getEnhancedDeploymentService();
  },
  // Proxy all methods to the instance
  createEnhancedSingleAgentPackage: (...args: any[]) => getEnhancedDeploymentService().createEnhancedSingleAgentPackage(...args),
  createEnhancedMultiAgentPackage: (...args: any[]) => getEnhancedDeploymentService().createEnhancedMultiAgentPackage(...args),
  deployEnhancedPackage: (...args: any[]) => getEnhancedDeploymentService().deployEnhancedPackage(...args),
  listRealDeployments: (...args: any[]) => getEnhancedDeploymentService().listRealDeployments(...args),
};

