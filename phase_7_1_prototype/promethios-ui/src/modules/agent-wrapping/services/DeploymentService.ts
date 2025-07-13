/**
 * Deployment Service
 * 
 * Comprehensive service for packaging, exporting, and deploying governed agents
 * and multi-agent systems to various target environments with embedded governance.
 * 
 * @author Manus AI
 * @version 1.0.0
 */

import { DualAgentWrapper, DeploymentWrapper } from '../types/dualWrapper';
import { MultiAgentDualWrapper, MultiAgentDeploymentPackage } from '../types/enhancedMultiAgent';
import { UnifiedStorageService } from '../../../services/UnifiedStorageService';

export interface DeploymentTarget {
  type: 'docker' | 'kubernetes' | 'serverless' | 'api' | 'standalone';
  environment: 'development' | 'staging' | 'production';
  platform: 'aws' | 'gcp' | 'azure' | 'local' | 'custom';
  configuration: Record<string, any>;
}

export interface DeploymentPackage {
  id: string;
  type: 'single-agent' | 'multi-agent';
  name: string;
  version: string;
  
  // Core configuration
  agentConfig?: DualAgentWrapper;
  multiAgentConfig?: MultiAgentDualWrapper;
  
  // Deployment artifacts
  artifacts: {
    dockerfile?: string;
    kubernetesManifests?: any[];
    serverlessConfig?: any;
    apiDefinition?: any;
    standaloneExecutable?: string;
  };
  
  // Runtime configuration
  runtime: {
    environmentVariables: Record<string, string>;
    secrets: Record<string, string>;
    dependencies: string[];
    ports: number[];
    volumes: string[];
    healthCheck: {
      endpoint: string;
      interval: number;
      timeout: number;
      retries: number;
    };
  };
  
  // Governance package
  governance: {
    policies: any[];
    trustConfiguration: any;
    complianceRules: any[];
    auditConfiguration: any;
    emergencyProcedures: any[];
    monitoringEndpoints: string[];
  };
  
  // Metadata
  metadata: {
    createdAt: string;
    createdBy: string;
    description: string;
    tags: string[];
    targetEnvironment: string;
    deploymentInstructions: string;
  };
}

export interface DeploymentResult {
  success: boolean;
  deploymentId: string;
  endpoint?: string;
  status: 'pending' | 'deploying' | 'deployed' | 'failed' | 'stopped';
  logs: string[];
  metrics?: {
    deploymentTime: number;
    resourceUsage: any;
    healthStatus: 'healthy' | 'unhealthy' | 'unknown';
  };
  error?: string;
}

export interface ExportOptions {
  format: 'json' | 'yaml' | 'docker' | 'kubernetes' | 'zip';
  includeSecrets: boolean;
  includeGovernance: boolean;
  includeDocumentation: boolean;
  compressionLevel: 'none' | 'fast' | 'best';
  encryptionKey?: string;
}

/**
 * Deployment Service for governed agents and multi-agent systems
 */
export class DeploymentService {
  private storage: UnifiedStorageService;
  private deployments: Map<string, DeploymentResult> = new Map();
  private packages: Map<string, DeploymentPackage> = new Map();

  constructor() {
    try {
      // Use a safer pattern to avoid minification issues
      const StorageServiceClass = UnifiedStorageService;
      this.storage = new StorageServiceClass();
    } catch (error) {
      console.error('❌ Error creating UnifiedStorageService:', error);
      // Fallback to a minimal storage implementation
      this.storage = {
        get: async () => null,
        set: async () => {},
        delete: async () => {},
        getKeys: async () => []
      } as any;
    }
  }

  /**
   * Create deployment package for single agent
   */
  async createSingleAgentDeploymentPackage(
    wrapper: DualAgentWrapper,
    target: DeploymentTarget,
    options: ExportOptions = this.getDefaultExportOptions()
  ): Promise<DeploymentPackage> {
    if (!wrapper.deploymentWrapper) {
      throw new Error('Deployment wrapper not found for agent');
    }

    const packageId = `pkg-agent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    const deploymentPackage: DeploymentPackage = {
      id: packageId,
      type: 'single-agent',
      name: wrapper.metadata.name,
      version: wrapper.metadata.version,
      agentConfig: wrapper,
      artifacts: await this.generateSingleAgentArtifacts(wrapper.deploymentWrapper, target, wrapper.baseAgent),
      runtime: this.generateRuntimeConfig(wrapper.deploymentWrapper, target, wrapper.baseAgent),
      governance: this.generateGovernancePackage(wrapper.deploymentWrapper),
      metadata: {
        createdAt: now,
        createdBy: 'system', // TODO: Get actual user
        description: wrapper.metadata.description,
        tags: wrapper.metadata.tags,
        targetEnvironment: target.environment,
        deploymentInstructions: this.generateDeploymentInstructions(target),
      },
    };

    // Store package
    this.packages.set(packageId, deploymentPackage);
    await this.storage.set('agents', `deployment-package-${packageId}`, deploymentPackage);

    console.log(`📦 Created single agent deployment package: ${packageId}`);
    return deploymentPackage;
  }

  /**
   * Create deployment package for multi-agent system
   */
  async createMultiAgentDeploymentPackage(
    multiAgentWrapper: MultiAgentDualWrapper,
    target: DeploymentTarget,
    options: ExportOptions = this.getDefaultExportOptions()
  ): Promise<DeploymentPackage> {
    if (!multiAgentWrapper.deploymentSystem) {
      throw new Error('Deployment system not found for multi-agent system');
    }

    const packageId = `pkg-multi-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    const deploymentPackage: DeploymentPackage = {
      id: packageId,
      type: 'multi-agent',
      name: multiAgentWrapper.metadata.name,
      version: multiAgentWrapper.metadata.version,
      multiAgentConfig: multiAgentWrapper,
      artifacts: await this.generateMultiAgentArtifacts(multiAgentWrapper.deploymentSystem, target),
      runtime: this.generateMultiAgentRuntimeConfig(multiAgentWrapper.deploymentSystem, target),
      governance: this.generateMultiAgentGovernancePackage(multiAgentWrapper.deploymentSystem),
      metadata: {
        createdAt: now,
        createdBy: 'system', // TODO: Get actual user
        description: multiAgentWrapper.metadata.description,
        tags: multiAgentWrapper.metadata.tags,
        targetEnvironment: target.environment,
        deploymentInstructions: this.generateMultiAgentDeploymentInstructions(target),
      },
    };

    // Store package
    this.packages.set(packageId, deploymentPackage);
    await this.storage.set('agents', `deployment-package-${packageId}`, deploymentPackage);

    console.log(`📦 Created multi-agent deployment package: ${packageId}`);
    return deploymentPackage;
  }

  /**
   * Export deployment package
   */
  async exportDeploymentPackage(
    packageId: string,
    options: ExportOptions = this.getDefaultExportOptions()
  ): Promise<Blob> {
    const deploymentPackage = this.packages.get(packageId) || 
      await this.storage.get('agents', `deployment-package-${packageId}`);
    
    if (!deploymentPackage) {
      throw new Error(`Deployment package not found: ${packageId}`);
    }

    // Prepare export data
    const exportData = this.prepareExportData(deploymentPackage, options);

    // Generate export based on format
    switch (options.format) {
      case 'json':
        return new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      
      case 'yaml':
        const yaml = this.convertToYaml(exportData);
        return new Blob([yaml], { type: 'application/yaml' });
      
      case 'docker':
        return this.generateDockerExport(deploymentPackage, options);
      
      case 'kubernetes':
        return this.generateKubernetesExport(deploymentPackage, options);
      
      case 'zip':
        return this.generateZipExport(deploymentPackage, options);
      
      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }
  }

  /**
   * Deploy package to target environment
   */
  async deployPackage(
    packageId: string,
    target: DeploymentTarget
  ): Promise<DeploymentResult> {
    const deploymentPackage = this.packages.get(packageId) || 
      await this.storage.get('agents', `deployment-package-${packageId}`);
    
    if (!deploymentPackage) {
      throw new Error(`Deployment package not found: ${packageId}`);
    }

    const deploymentId = `deploy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();

    try {
      // Initialize deployment result
      const result: DeploymentResult = {
        success: false,
        deploymentId,
        status: 'pending',
        logs: [`Starting deployment of ${deploymentPackage.name}...`],
      };

      this.deployments.set(deploymentId, result);

      // Update status to deploying
      result.status = 'deploying';
      result.logs.push(`Deploying to ${target.platform} ${target.environment}...`);

      // Simulate deployment process (in real implementation, this would call actual deployment APIs)
      await this.simulateDeployment(deploymentPackage, target, result);

      // Update final status
      result.success = true;
      result.status = 'deployed';
      result.endpoint = this.generateEndpoint(deploymentPackage, target);
      result.metrics = {
        deploymentTime: Date.now() - startTime,
        resourceUsage: this.generateResourceUsage(deploymentPackage),
        healthStatus: 'healthy',
      };
      result.logs.push(`Deployment completed successfully!`);
      result.logs.push(`Endpoint: ${result.endpoint}`);

      // Store deployment result
      await this.storage.set('agents', `deployment-result-${deploymentId}`, result);

      console.log(`🚀 Deployed package ${packageId} as ${deploymentId}`);
      return result;

    } catch (error) {
      const result: DeploymentResult = {
        success: false,
        deploymentId,
        status: 'failed',
        logs: [`Deployment failed: ${error.message}`],
        error: error.message,
      };

      this.deployments.set(deploymentId, result);
      await this.storage.set('agents', `deployment-result-${deploymentId}`, result);

      console.error(`❌ Deployment failed for package ${packageId}:`, error);
      return result;
    }
  }

  /**
   * Get deployment status
   */
  async getDeploymentStatus(deploymentId: string): Promise<DeploymentResult | null> {
    return this.deployments.get(deploymentId) || 
      await this.storage.get('agents', `deployment-result-${deploymentId}`) || null;
  }

  /**
   * Stop deployment
   */
  async stopDeployment(deploymentId: string): Promise<void> {
    const deployment = await this.getDeploymentStatus(deploymentId);
    if (!deployment) {
      throw new Error(`Deployment not found: ${deploymentId}`);
    }

    deployment.status = 'stopped';
    deployment.logs.push('Deployment stopped by user');
    
    this.deployments.set(deploymentId, deployment);
    await this.storage.set('agents', `deployment-result-${deploymentId}`, deployment);

    console.log(`⏹️ Stopped deployment: ${deploymentId}`);
  }

  /**
   * List user deployments
   */
  async listDeployments(userId: string): Promise<DeploymentResult[]> {
    // In real implementation, this would query by user ID
    return Array.from(this.deployments.values());
  }

  /**
   * Generate artifacts for single agent
   */
  private async generateSingleAgentArtifacts(
    deploymentWrapper: DeploymentWrapper,
    target: DeploymentTarget,
    baseAgent: DualAgentWrapper['baseAgent']
  ): Promise<DeploymentPackage['artifacts']> {
    const artifacts: DeploymentPackage['artifacts'] = {};

    switch (target.type) {
      case 'docker':
        artifacts.dockerfile = this.generateDockerfile(deploymentWrapper);
        break;
      
      case 'kubernetes':
        artifacts.kubernetesManifests = this.generateKubernetesManifests(deploymentWrapper, baseAgent);
        break;
      
      case 'serverless':
        artifacts.serverlessConfig = this.generateServerlessConfig(deploymentWrapper, baseAgent);
        break;
      
      case 'api':
        artifacts.apiDefinition = this.generateApiDefinition(deploymentWrapper, baseAgent);
        break;
      
      case 'standalone':
        artifacts.standaloneExecutable = this.generateStandaloneExecutable(deploymentWrapper, baseAgent);
        break;
    }

    return artifacts;
  }

  /**
   * Generate artifacts for multi-agent system
   */
  private async generateMultiAgentArtifacts(
    deploymentSystem: any,
    target: DeploymentTarget
  ): Promise<DeploymentPackage['artifacts']> {
    const artifacts: DeploymentPackage['artifacts'] = {};

    switch (target.type) {
      case 'docker':
        artifacts.dockerfile = this.generateMultiAgentDockerfile(deploymentSystem);
        break;
      
      case 'kubernetes':
        artifacts.kubernetesManifests = this.generateMultiAgentKubernetesManifests(deploymentSystem);
        break;
      
      case 'serverless':
        artifacts.serverlessConfig = this.generateMultiAgentServerlessConfig(deploymentSystem);
        break;
    }

    return artifacts;
  }

  /**
   * Generate runtime configuration
   */
  private generateRuntimeConfig(
    deploymentWrapper: DeploymentWrapper,
    target: DeploymentTarget,
    baseAgent: DualAgentWrapper['baseAgent']
  ): DeploymentPackage['runtime'] {
    // Defensive coding: Extract agent name from various possible sources
    const agentName = baseAgent?.name || 
                     deploymentWrapper?.metadata?.name || 
                     deploymentWrapper?.name || 
                     'unnamed-agent';
    
    // Defensive coding: Extract API key from various possible sources
    const apiKey = baseAgent?.configuration?.apiKey || 
                   deploymentWrapper?.configuration?.apiKey ||
                   deploymentWrapper?.apiKey ||
                   'generated-api-key';
    
    return {
      environmentVariables: {
        NODE_ENV: target.environment,
        AGENT_NAME: agentName,
        GOVERNANCE_ENABLED: 'true',
        TRUST_THRESHOLD: deploymentWrapper.governanceConfig?.trustThreshold?.toString() || '0.8',
        ...deploymentWrapper.deploymentConfig?.environmentVariables,
      },
      secrets: {
        API_KEY: apiKey,
        GOVERNANCE_SECRET: 'generated-secret',
      },
      dependencies: [
        'node:18-alpine',
        'governance-engine',
        'trust-manager',
        'audit-logger',
      ],
      ports: [8080, 8443],
      volumes: ['/app/data', '/app/logs'],
      healthCheck: {
        endpoint: '/health',
        interval: 30,
        timeout: 10,
        retries: 3,
      },
    };
  }

  /**
   * Generate multi-agent runtime configuration
   */
  private generateMultiAgentRuntimeConfig(
    deploymentSystem: any,
    target: DeploymentTarget
  ): DeploymentPackage['runtime'] {
    return {
      environmentVariables: {
        NODE_ENV: target.environment,
        SYSTEM_NAME: deploymentSystem.system.name,
        SYSTEM_TYPE: deploymentSystem.system.systemMetadata.systemType,
        COLLABORATION_MODEL: deploymentSystem.system.systemMetadata.collaborationModel,
        GOVERNANCE_ENABLED: 'true',
        CROSS_AGENT_VALIDATION: 'true',
        ...deploymentSystem.deploymentConfig?.environmentVariables,
      },
      secrets: {
        SYSTEM_SECRET: 'generated-system-secret',
        GOVERNANCE_SECRET: 'generated-governance-secret',
      },
      dependencies: [
        'node:18-alpine',
        'multi-agent-orchestrator',
        'governance-engine',
        'collaboration-manager',
      ],
      ports: [8080, 8443, 9090], // Main, secure, metrics
      volumes: ['/app/data', '/app/logs', '/app/shared'],
      healthCheck: {
        endpoint: '/system/health',
        interval: 30,
        timeout: 15,
        retries: 3,
      },
    };
  }

  /**
   * Generate governance package
   */
  private generateGovernancePackage(deploymentWrapper: DeploymentWrapper): DeploymentPackage['governance'] {
    return {
      policies: deploymentWrapper.governanceConfig.policies,
      trustConfiguration: {
        threshold: deploymentWrapper.governanceConfig.trustThreshold,
        decayRate: 0.1,
        recoveryRate: 0.05,
      },
      complianceRules: [
        {
          id: 'response-time',
          description: 'Maximum response time',
          threshold: 5000,
          action: 'warn',
        },
        {
          id: 'trust-score',
          description: 'Minimum trust score',
          threshold: deploymentWrapper.governanceConfig.trustThreshold,
          action: 'block',
        },
      ],
      auditConfiguration: {
        level: deploymentWrapper.governanceConfig.auditLevel,
        retention: '30d',
        destinations: ['file', 'database'],
      },
      emergencyProcedures: [
        {
          trigger: 'trust_below_threshold',
          action: 'suspend_agent',
          notification: true,
        },
        {
          trigger: 'policy_violation_critical',
          action: 'emergency_stop',
          notification: true,
        },
      ],
      monitoringEndpoints: ['/metrics', '/health', '/governance/status'],
    };
  }

  /**
   * Generate multi-agent governance package
   */
  private generateMultiAgentGovernancePackage(deploymentSystem: any): DeploymentPackage['governance'] {
    return {
      policies: deploymentSystem.governanceConfig.policies,
      trustConfiguration: {
        systemThreshold: deploymentSystem.governanceConfig.trustThreshold,
        crossAgentValidation: true,
        consensusThreshold: 0.7,
      },
      complianceRules: [
        {
          id: 'system-response-time',
          description: 'Maximum system response time',
          threshold: 10000,
          action: 'warn',
        },
        {
          id: 'cross-agent-trust',
          description: 'Minimum cross-agent trust',
          threshold: 0.6,
          action: 'isolate',
        },
      ],
      auditConfiguration: {
        level: deploymentSystem.governanceConfig.auditLevel,
        retention: '90d',
        destinations: ['file', 'database', 'stream'],
        crossAgentTracking: true,
      },
      emergencyProcedures: [
        {
          trigger: 'system_trust_below_threshold',
          action: 'emergency_stop_system',
          notification: true,
        },
        {
          trigger: 'agent_isolation_required',
          action: 'isolate_agent',
          notification: true,
        },
      ],
      monitoringEndpoints: ['/system/metrics', '/system/health', '/governance/status', '/collaboration/metrics'],
    };
  }

  /**
   * Helper methods for artifact generation
   */
  private generateDockerfile(deploymentWrapper: DeploymentWrapper): string {
    return `
FROM node:18-alpine

WORKDIR /app

# Install governance dependencies
RUN npm install -g governance-engine trust-manager audit-logger

# Copy agent configuration
COPY agent-config.json /app/
COPY governance-config.json /app/

# Copy governance engine
COPY governance/ /app/governance/

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy application code
COPY . .

# Expose ports
EXPOSE 8080 8443

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \\
  CMD curl -f http://localhost:8080/health || exit 1

# Start with governance
CMD ["node", "index.js", "--governance-enabled"]
`.trim();
  }

  private generateKubernetesManifests(
    deploymentWrapper: DeploymentWrapper,
    baseAgent: DualAgentWrapper['baseAgent']
  ): any[] {
    // Defensive coding: Extract agent name from various possible sources
    const agentName = baseAgent?.name || 
                     deploymentWrapper?.metadata?.name || 
                     deploymentWrapper?.name || 
                     'unnamed-agent';
    
    return [
      {
        apiVersion: 'apps/v1',
        kind: 'Deployment',
        metadata: {
          name: `${agentName}-deployment`,
          labels: {
            app: agentName,
            governance: 'enabled',
          },
        },
        spec: {
          replicas: 1,
          selector: {
            matchLabels: {
              app: agentName,
            },
          },
          template: {
            metadata: {
              labels: {
                app: agentName,
              },
            },
            spec: {
              containers: [
                {
                  name: agentName,
                  image: `${agentName}:latest`,
                  ports: [
                    { containerPort: 8080 },
                    { containerPort: 8443 },
                  ],
                  env: [
                    { name: 'GOVERNANCE_ENABLED', value: 'true' },
                    { name: 'TRUST_THRESHOLD', value: deploymentWrapper.governanceConfig?.trustThreshold?.toString() || '0.8' },
                  ],
                  livenessProbe: {
                    httpGet: {
                      path: '/health',
                      port: 8080,
                    },
                    initialDelaySeconds: 30,
                    periodSeconds: 10,
                  },
                },
              ],
            },
          },
        },
      },
      {
        apiVersion: 'v1',
        kind: 'Service',
        metadata: {
          name: `${agentName}-service`,
        },
        spec: {
          selector: {
            app: agentName,
          },
          ports: [
            { port: 80, targetPort: 8080 },
            { port: 443, targetPort: 8443 },
          ],
          type: 'LoadBalancer',
        },
      },
    ];
  }

  /**
   * Simulation and helper methods
   */
  private async simulateDeployment(
    deploymentPackage: DeploymentPackage,
    target: DeploymentTarget,
    result: DeploymentResult
  ): Promise<void> {
    // Simulate deployment steps
    const steps = [
      'Validating configuration...',
      'Building container image...',
      'Pushing to registry...',
      'Creating deployment resources...',
      'Starting services...',
      'Running health checks...',
      'Configuring governance...',
      'Deployment complete!',
    ];

    for (const step of steps) {
      result.logs.push(step);
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate work
    }
  }

  private generateEndpoint(deploymentPackage: DeploymentPackage, target: DeploymentTarget): string {
    const subdomain = deploymentPackage.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    return `https://${subdomain}.${target.platform}.example.com`;
  }

  private generateResourceUsage(deploymentPackage: DeploymentPackage): any {
    return {
      cpu: '100m',
      memory: '256Mi',
      storage: '1Gi',
      network: '10Mbps',
    };
  }

  private getDefaultExportOptions(): ExportOptions {
    return {
      format: 'json',
      includeSecrets: false,
      includeGovernance: true,
      includeDocumentation: true,
      compressionLevel: 'fast',
    };
  }

  private prepareExportData(deploymentPackage: DeploymentPackage, options: ExportOptions): any {
    const exportData = { ...deploymentPackage };

    if (!options.includeSecrets) {
      delete exportData.runtime.secrets;
    }

    if (!options.includeGovernance) {
      delete exportData.governance;
    }

    return exportData;
  }

  private convertToYaml(data: any): string {
    // Simple YAML conversion (in real implementation, use a proper YAML library)
    return JSON.stringify(data, null, 2).replace(/"/g, '');
  }

  private generateDockerExport(deploymentPackage: DeploymentPackage, options: ExportOptions): Blob {
    const dockerContent = deploymentPackage.artifacts.dockerfile || '';
    return new Blob([dockerContent], { type: 'text/plain' });
  }

  private generateKubernetesExport(deploymentPackage: DeploymentPackage, options: ExportOptions): Blob {
    const k8sContent = JSON.stringify(deploymentPackage.artifacts.kubernetesManifests, null, 2);
    return new Blob([k8sContent], { type: 'application/json' });
  }

  private generateZipExport(deploymentPackage: DeploymentPackage, options: ExportOptions): Blob {
    // In real implementation, create actual ZIP file
    const zipContent = JSON.stringify(deploymentPackage, null, 2);
    return new Blob([zipContent], { type: 'application/zip' });
  }

  private generateDeploymentInstructions(target: DeploymentTarget): string {
    return `
Deployment Instructions for ${target.type} on ${target.platform}:

1. Extract the deployment package
2. Configure environment variables
3. Deploy using the provided artifacts
4. Verify governance endpoints are accessible
5. Run health checks
6. Monitor governance metrics

For detailed instructions, see the documentation included in this package.
`.trim();
  }

  private generateMultiAgentDeploymentInstructions(target: DeploymentTarget): string {
    return `
Multi-Agent System Deployment Instructions for ${target.type} on ${target.platform}:

1. Extract the deployment package
2. Configure system environment variables
3. Deploy orchestrator and agent services
4. Configure cross-agent communication
5. Verify governance endpoints are accessible
6. Test collaboration workflows
7. Monitor system-level governance metrics

For detailed instructions, see the documentation included in this package.
`.trim();
  }

  // Placeholder methods for multi-agent specific artifact generation
  private generateMultiAgentDockerfile(deploymentSystem: any): string {
    return `# Multi-Agent System Dockerfile\n# Generated for ${deploymentSystem.system.name}`;
  }

  private generateMultiAgentKubernetesManifests(deploymentSystem: any): any[] {
    return [{ kind: 'Deployment', metadata: { name: deploymentSystem.system.name } }];
  }

  private generateMultiAgentServerlessConfig(deploymentSystem: any): any {
    return { service: deploymentSystem.system.name };
  }

  private generateServerlessConfig(
    deploymentWrapper: DeploymentWrapper,
    baseAgent: DualAgentWrapper['baseAgent']
  ): any {
    const agentName = baseAgent?.name || 
                     deploymentWrapper?.metadata?.name || 
                     deploymentWrapper?.name || 
                     'unnamed-agent';
    return { service: agentName };
  }

  private generateApiDefinition(
    deploymentWrapper: DeploymentWrapper,
    baseAgent: DualAgentWrapper['baseAgent']
  ): any {
    const agentName = baseAgent?.name || 
                     deploymentWrapper?.metadata?.name || 
                     deploymentWrapper?.name || 
                     'unnamed-agent';
    return { openapi: '3.0.0', info: { title: agentName } };
  }

  private generateStandaloneExecutable(
    deploymentWrapper: DeploymentWrapper,
    baseAgent: DualAgentWrapper['baseAgent']
  ): string {
    const agentName = baseAgent?.name || 
                     deploymentWrapper?.metadata?.name || 
                     deploymentWrapper?.name || 
                     'unnamed-agent';
    return `#!/bin/bash\n# Standalone executable for ${agentName}`;
  }
}

