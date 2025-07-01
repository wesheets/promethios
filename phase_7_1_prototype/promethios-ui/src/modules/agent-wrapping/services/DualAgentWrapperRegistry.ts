/**
 * Dual Agent Wrapper Registry
 * 
 * Enhanced registry that extends the existing AgentWrapperRegistry to support
 * dual-wrapping functionality, creating both testing and deployment versions
 * of wrapped agents while maintaining backward compatibility.
 * 
 * @author Manus AI
 * @version 1.0.0
 */

import { 
  DualAgentWrapper, 
  TestingWrapper, 
  DeploymentWrapper,
  CreateDualWrapperRequest,
  UpdateDualWrapperRequest,
  WrapperQueryFilters,
  WrapperQueryResult,
  GovernanceConfiguration,
  ExportConfiguration,
  DeploymentPackage
} from '../types/dualWrapper';
import { GovernanceEngine } from '../types/governance';
import { DualWrapperStorage } from '../types/storage';
import AgentWrapperRegistry from './AgentWrapperRegistry';
import { AgentWrapperConfig, AgentWrapper } from '../types';

/**
 * Enhanced registry for dual-wrapping functionality
 */
export class DualAgentWrapperRegistry extends AgentWrapperRegistry {
  private dualWrappers: Map<string, DualAgentWrapper> = new Map();
  private governanceEngines: Map<string, GovernanceEngine> = new Map();
  private storage: DualWrapperStorage;
  private currentUserId: string | null = null;

  constructor(storage: DualWrapperStorage) {
    super();
    this.storage = storage;
  }

  /**
   * Set the current user context
   */
  setCurrentUser(userId: string): void {
    this.currentUserId = userId;
  }

  /**
   * Create a dual wrapper with both testing and deployment versions
   */
  async createDualWrapper(request: CreateDualWrapperRequest): Promise<DualAgentWrapper> {
    if (!this.currentUserId) {
      throw new Error('User context not set. Call setCurrentUser() first.');
    }

    const wrapperId = this.generateId();
    const now = new Date();

    // Create testing wrapper (existing behavior)
    const testingWrapper = await this.createTestingWrapper(wrapperId, request);

    // Create deployment wrapper with governance
    const deploymentWrapper = await this.createDeploymentWrapper(wrapperId, request);

    // Create the dual wrapper
    const dualWrapper: DualAgentWrapper = {
      id: wrapperId,
      baseAgent: {
        ...request.baseAgent,
        capabilities: request.baseAgent.capabilities || [],
      },
      testingWrapper,
      deploymentWrapper,
      status: {
        testingStatus: 'active',
        deploymentStatus: 'building',
        lastTested: null,
        lastDeployed: null,
      },
      metadata: {
        createdAt: now,
        updatedAt: now,
        version: '1.0.0',
        userId: this.currentUserId,
        tags: request.metadata?.tags || [],
        description: request.metadata?.description,
      },
    };

    // Store in memory and persistent storage
    this.dualWrappers.set(wrapperId, dualWrapper);
    await this.storage.createWrapper(dualWrapper);

    // Create legacy wrapper for backward compatibility
    await this.createLegacyWrapper(dualWrapper);

    console.log(`🎯 Created dual wrapper: ${dualWrapper.baseAgent.name} (${wrapperId})`);
    return dualWrapper;
  }

  /**
   * Get a dual wrapper by ID
   */
  async getDualWrapper(wrapperId: string): Promise<DualAgentWrapper | null> {
    // Check memory cache first
    if (this.dualWrappers.has(wrapperId)) {
      return this.dualWrappers.get(wrapperId)!;
    }

    // Load from storage
    const wrapper = await this.storage.getWrapper(wrapperId);
    if (wrapper) {
      this.dualWrappers.set(wrapperId, wrapper);
    }

    return wrapper;
  }

  /**
   * Update a dual wrapper
   */
  async updateDualWrapper(request: UpdateDualWrapperRequest): Promise<void> {
    const wrapper = await this.getDualWrapper(request.wrapperId);
    if (!wrapper) {
      throw new Error(`Dual wrapper not found: ${request.wrapperId}`);
    }

    const now = new Date();
    const updates: Partial<DualAgentWrapper> = {
      metadata: {
        ...wrapper.metadata,
        updatedAt: now,
        version: this.incrementVersion(wrapper.metadata.version),
      },
    };

    // Apply base agent updates
    if (request.updates.baseAgent) {
      updates.baseAgent = {
        ...wrapper.baseAgent,
        ...request.updates.baseAgent,
      };
    }

    // Apply metadata updates
    if (request.updates.metadata) {
      updates.metadata = {
        ...updates.metadata!,
        ...request.updates.metadata,
      };
    }

    // Update governance configuration if provided
    if (request.updates.governanceConfig) {
      updates.deploymentWrapper = {
        ...wrapper.deploymentWrapper,
        governanceConfig: {
          ...wrapper.deploymentWrapper.governanceConfig,
          ...request.updates.governanceConfig,
          metadata: {
            ...wrapper.deploymentWrapper.governanceConfig.metadata,
            updatedAt: now,
          },
        },
        metadata: {
          ...wrapper.deploymentWrapper.metadata,
          updatedAt: now,
        },
      };

      // Regenerate deployment if requested
      if (request.regenerateDeployment) {
        updates.status = {
          ...wrapper.status,
          deploymentStatus: 'building',
        };
      }
    }

    // Update in memory and storage
    const updatedWrapper = { ...wrapper, ...updates };
    this.dualWrappers.set(request.wrapperId, updatedWrapper);
    await this.storage.updateWrapper(request.wrapperId, updates);

    // Update legacy wrapper for backward compatibility
    await this.updateLegacyWrapper(updatedWrapper);

    console.log(`🔄 Updated dual wrapper: ${updatedWrapper.baseAgent.name} (${request.wrapperId})`);
  }

  /**
   * Delete a dual wrapper
   */
  async deleteDualWrapper(wrapperId: string): Promise<void> {
    const wrapper = await this.getDualWrapper(wrapperId);
    if (!wrapper) {
      throw new Error(`Dual wrapper not found: ${wrapperId}`);
    }

    // Stop governance engine if running
    const engine = this.governanceEngines.get(wrapperId);
    if (engine) {
      await engine.stop();
      this.governanceEngines.delete(wrapperId);
    }

    // Delete from storage
    await this.storage.deleteWrapper(wrapperId);

    // Delete deployment package if exists
    if (wrapper.deploymentWrapper.packageInfo.path) {
      try {
        await this.storage.deletePackage(wrapper.deploymentWrapper.id);
      } catch (error) {
        console.warn(`Failed to delete deployment package: ${error}`);
      }
    }

    // Remove from memory
    this.dualWrappers.delete(wrapperId);

    // Remove legacy wrapper
    await this.removeLegacyWrapper(wrapperId);

    console.log(`🗑️ Deleted dual wrapper: ${wrapper.baseAgent.name} (${wrapperId})`);
  }

  /**
   * List dual wrappers for the current user
   */
  async listDualWrappers(filters?: WrapperQueryFilters): Promise<WrapperQueryResult> {
    if (!this.currentUserId) {
      throw new Error('User context not set. Call setCurrentUser() first.');
    }

    const queryFilters = {
      userId: this.currentUserId,
      ...filters,
    };

    const wrappers = await this.storage.listWrappers(this.currentUserId, queryFilters);
    
    // Cache in memory
    wrappers.forEach(wrapper => {
      this.dualWrappers.set(wrapper.id, wrapper);
    });

    return {
      wrappers,
      total: wrappers.length,
      page: Math.floor((filters?.offset || 0) / (filters?.limit || 10)) + 1,
      pageSize: filters?.limit || 10,
      hasMore: wrappers.length === (filters?.limit || 10),
    };
  }

  /**
   * Export a deployment wrapper as a package
   */
  async exportDeploymentWrapper(
    wrapperId: string, 
    exportConfig: ExportConfiguration
  ): Promise<DeploymentPackage> {
    const wrapper = await this.getDualWrapper(wrapperId);
    if (!wrapper) {
      throw new Error(`Dual wrapper not found: ${wrapperId}`);
    }

    if (wrapper.status.deploymentStatus !== 'ready') {
      throw new Error(`Deployment wrapper not ready for export: ${wrapper.status.deploymentStatus}`);
    }

    console.log(`📦 Exporting deployment wrapper: ${wrapper.baseAgent.name} (${wrapperId})`);

    // Create deployment package
    const packageData = await this.createDeploymentPackage(wrapper, exportConfig);

    // Store package
    const packageId = await this.storage.storePackage(wrapperId, packageData);

    // Update wrapper status
    await this.updateDualWrapper({
      wrapperId,
      updates: {
        metadata: {
          ...wrapper.metadata,
        },
      },
    });

    const deploymentPackage: DeploymentPackage = {
      id: packageId,
      wrapperId,
      format: exportConfig.format,
      version: wrapper.metadata.version,
      size: packageData.binaryData.byteLength,
      checksum: packageData.packageInfo.checksum,
      path: packageData.packageInfo.path,
      metadata: {
        createdAt: new Date(),
        downloadCount: 0,
      },
      validation: {
        tested: exportConfig.validation.runTests,
        governanceValidated: exportConfig.validation.validateGovernance,
        performanceValidated: exportConfig.validation.performanceCheck,
        securityValidated: exportConfig.validation.securityScan,
      },
    };

    console.log(`✅ Exported deployment package: ${packageId}`);
    return deploymentPackage;
  }

  /**
   * Get governance engine for a wrapper
   */
  async getGovernanceEngine(wrapperId: string): Promise<GovernanceEngine | null> {
    return this.governanceEngines.get(wrapperId) || null;
  }

  /**
   * Load all wrappers for the current user
   */
  async loadUserWrappers(): Promise<void> {
    if (!this.currentUserId) {
      throw new Error('User context not set. Call setCurrentUser() first.');
    }

    const wrappers = await this.storage.listWrappers(this.currentUserId);
    
    // Clear existing cache and load fresh data
    this.dualWrappers.clear();
    wrappers.forEach(wrapper => {
      this.dualWrappers.set(wrapper.id, wrapper);
    });

    // Also load legacy wrappers for backward compatibility
    await super.loadWrappers(this.currentUserId);

    console.log(`📥 Loaded ${wrappers.length} dual wrappers for user: ${this.currentUserId}`);
  }

  /**
   * Get storage usage information
   */
  async getStorageUsage(): Promise<any> {
    if (!this.currentUserId) {
      throw new Error('User context not set. Call setCurrentUser() first.');
    }

    return await this.storage.getStorageUsage(this.currentUserId);
  }

  // Private helper methods

  /**
   * Create testing wrapper (existing behavior)
   */
  private async createTestingWrapper(
    wrapperId: string, 
    request: CreateDualWrapperRequest
  ): Promise<TestingWrapper> {
    const now = new Date();

    // Create legacy wrapper config
    const legacyConfig: AgentWrapperConfig = {
      id: wrapperId,
      name: request.baseAgent.name,
      description: request.baseAgent.description,
      agentType: request.baseAgent.provider as any,
      configuration: request.baseAgent.configuration,
      governanceLevel: request.governanceConfig.complianceLevel === 'basic' ? 'basic' :
                      request.governanceConfig.complianceLevel === 'standard' ? 'standard' :
                      request.governanceConfig.complianceLevel === 'strict' ? 'strict' : 'none',
      metadata: {
        createdAt: now,
        updatedAt: now,
        version: '1.0.0',
        userId: this.currentUserId!,
        tags: request.metadata?.tags,
      },
    };

    return {
      id: `${wrapperId}_testing`,
      type: 'configuration',
      config: legacyConfig,
      storageKey: `users/${this.currentUserId}/wrappers/${wrapperId}`,
      metadata: {
        createdAt: now,
        updatedAt: now,
        version: '1.0.0',
      },
    };
  }

  /**
   * Create deployment wrapper with governance
   */
  private async createDeploymentWrapper(
    wrapperId: string,
    request: CreateDualWrapperRequest
  ): Promise<DeploymentWrapper> {
    const now = new Date();

    return {
      id: `${wrapperId}_deployment`,
      type: 'governed',
      governanceConfig: {
        ...request.governanceConfig,
        metadata: {
          ...request.governanceConfig.metadata,
          createdBy: this.currentUserId!,
        },
      },
      packageInfo: {
        path: '', // Will be set during packaging
        format: request.exportConfig?.format || 'api_service',
        version: '1.0.0',
        size: 0,
        checksum: '',
      },
      deploymentMetadata: {
        supportedEnvironments: ['node', 'docker', 'serverless'],
        requirements: {
          node: '>=16.0.0',
          memory: '512MB',
          cpu: '0.5 cores',
        },
        documentation: '',
        examples: [],
      },
      metadata: {
        createdAt: now,
        updatedAt: now,
        version: '1.0.0',
        buildId: this.generateId(),
      },
    };
  }

  /**
   * Create legacy wrapper for backward compatibility
   */
  private async createLegacyWrapper(dualWrapper: DualAgentWrapper): Promise<void> {
    const legacyWrapper: AgentWrapper = {
      id: dualWrapper.id,
      config: dualWrapper.testingWrapper.config,
      status: dualWrapper.status.testingStatus,
      lastUsed: dualWrapper.status.lastTested,
      usageCount: 0,
      errorCount: 0,
    };

    this.wrappers.set(dualWrapper.id, legacyWrapper);
    await this.persistWrapper(legacyWrapper);
  }

  /**
   * Update legacy wrapper for backward compatibility
   */
  private async updateLegacyWrapper(dualWrapper: DualAgentWrapper): Promise<void> {
    const legacyWrapper = this.wrappers.get(dualWrapper.id);
    if (legacyWrapper) {
      legacyWrapper.config = dualWrapper.testingWrapper.config;
      legacyWrapper.status = dualWrapper.status.testingStatus;
      legacyWrapper.lastUsed = dualWrapper.status.lastTested;
      
      await this.persistWrapper(legacyWrapper);
    }
  }

  /**
   * Remove legacy wrapper
   */
  private async removeLegacyWrapper(wrapperId: string): Promise<void> {
    this.wrappers.delete(wrapperId);
    await this.removeWrapper(wrapperId);
  }

  /**
   * Create deployment package
   */
  private async createDeploymentPackage(
    wrapper: DualAgentWrapper,
    exportConfig: ExportConfiguration
  ): Promise<any> {
    // This is a placeholder for the actual packaging logic
    // In a real implementation, this would:
    // 1. Bundle the governed agent with its governance engine
    // 2. Create the appropriate package format (Docker, npm, etc.)
    // 3. Run validation tests if requested
    // 4. Generate documentation and examples

    const packageContent = {
      agent: wrapper.baseAgent,
      governance: wrapper.deploymentWrapper.governanceConfig,
      runtime: {
        format: exportConfig.format,
        target: exportConfig.target,
        options: exportConfig.options,
      },
      metadata: {
        version: wrapper.metadata.version,
        createdAt: new Date(),
        wrapperId: wrapper.id,
      },
    };

    const packageJson = JSON.stringify(packageContent, null, 2);
    const binaryData = new TextEncoder().encode(packageJson);

    return {
      id: this.generateId(),
      wrapperId: wrapper.id,
      packageInfo: {
        path: `/packages/${wrapper.id}/${exportConfig.format}`,
        format: exportConfig.format,
        version: wrapper.metadata.version,
        size: binaryData.byteLength,
        checksum: await this.calculateChecksum(binaryData),
      },
      binaryData,
      metadata: {
        createdAt: new Date(),
        downloadCount: 0,
      },
      validation: {
        tested: false,
        governanceValidated: false,
        performanceValidated: false,
        securityValidated: false,
      },
    };
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `dw_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Increment version string
   */
  private incrementVersion(version: string): string {
    const parts = version.split('.');
    const patch = parseInt(parts[2] || '0') + 1;
    return `${parts[0]}.${parts[1]}.${patch}`;
  }

  /**
   * Calculate checksum for binary data
   */
  private async calculateChecksum(data: Uint8Array): Promise<string> {
    // Simple checksum implementation
    // In production, use a proper hash function like SHA-256
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      sum += data[i];
    }
    return sum.toString(16);
  }

  // Override parent methods to maintain compatibility

  /**
   * Override registerWrapper to create dual wrapper
   */
  async registerWrapper(config: AgentWrapperConfig): Promise<string> {
    // Convert legacy config to dual wrapper request
    const request: CreateDualWrapperRequest = {
      baseAgent: {
        name: config.name,
        description: config.description,
        provider: config.agentType,
        model: config.configuration.model || 'gpt-4',
        configuration: config.configuration,
      },
      governanceConfig: {
        policies: [],
        trustConfig: {
          initialScore: 75,
          minimumThreshold: 50,
          decayRate: 0.1,
          recoveryRate: 0.05,
          factors: [],
          evaluationInterval: 60,
        },
        auditConfig: {
          enabled: true,
          logLevel: 'standard',
          retention: { days: 90 },
          destinations: [],
          includeContent: false,
          includeMetadata: true,
        },
        complianceLevel: config.governanceLevel === 'none' ? 'basic' : config.governanceLevel,
        emergencyControls: {
          enabled: true,
          triggers: [],
          actions: [],
          notificationChannels: [],
        },
        metadata: {
          version: '1.0.0',
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: this.currentUserId || '',
        },
      },
    };

    const dualWrapper = await this.createDualWrapper(request);
    return dualWrapper.id;
  }

  /**
   * Override getUserWrappers to return legacy wrappers
   */
  getUserWrappers(userId: string): AgentWrapper[] {
    return Array.from(this.wrappers.values()).filter(
      wrapper => wrapper.config.metadata.userId === userId
    );
  }

  /**
   * Get dual wrappers for user
   */
  getUserDualWrappers(userId: string): DualAgentWrapper[] {
    return Array.from(this.dualWrappers.values()).filter(
      wrapper => wrapper.metadata.userId === userId
    );
  }

  /**
   * Create a dual wrapper for multi-agent systems
   */
  async createMultiAgentDualWrapper(
    userId: string,
    systemConfig: any,
    governanceConfig: GovernanceConfiguration,
    options: {
      createTesting: boolean;
      createDeployment: boolean;
      governanceLevel: 'basic' | 'standard' | 'strict';
      deploymentTarget: 'internal' | 'external' | 'both';
    }
  ): Promise<DualAgentWrapper> {
    if (!userId) {
      throw new Error('User ID is required for multi-agent dual wrapper creation');
    }

    this.setCurrentUser(userId);

    const wrapperId = `multi-agent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    // Create base agent configuration for multi-agent system
    const baseAgent = {
      id: wrapperId,
      name: systemConfig.name,
      description: systemConfig.description,
      provider: 'multi-agent-system',
      endpoint: `multi-agent://${wrapperId}`,
      apiKey: 'system-managed',
      model: 'multi-agent-orchestrator',
      inputSchema: {
        type: 'object',
        properties: {
          message: { type: 'string' },
          agents: { type: 'array', items: { type: 'string' } },
          collaborationModel: { type: 'string' }
        }
      },
      outputSchema: {
        type: 'object',
        properties: {
          response: { type: 'string' },
          agentResponses: { type: 'array' },
          collaborationMetrics: { type: 'object' }
        }
      }
    };

    // Create testing wrapper if requested
    let testingWrapper: TestingWrapper | null = null;
    if (options.createTesting) {
      testingWrapper = {
        id: `${wrapperId}-testing`,
        type: 'testing',
        baseAgent,
        governanceConfig: {
          ...governanceConfig,
          // Testing version uses lighter governance
          policies: governanceConfig.policies.map(p => ({ ...p, enforcement: 'warn' as const })),
          emergencyControls: false,
        },
        metadata: {
          name: `${systemConfig.name} (Testing)`,
          description: `Testing version of ${systemConfig.name} multi-agent system`,
          version: '1.0.0',
          createdAt: now,
          updatedAt: now,
          tags: ['testing', 'multi-agent', systemConfig.type],
          multiAgentConfig: {
            systemType: systemConfig.type,
            agents: systemConfig.agents,
            roles: systemConfig.roles,
            connections: systemConfig.connections,
            collaborationModel: systemConfig.collaborationModel,
            governanceRules: systemConfig.governanceRules,
          }
        },
        status: {
          isActive: true,
          lastUsed: now,
          usageCount: 0,
          errorCount: 0,
          lastError: null,
        },
      };
    }

    // Create deployment wrapper if requested
    let deploymentWrapper: DeploymentWrapper | null = null;
    if (options.createDeployment) {
      // Import governance engine components
      const { GovernanceFactory } = await import('./governance');
      const governanceEngine = GovernanceFactory.createEngine(options.governanceLevel);

      deploymentWrapper = {
        id: `${wrapperId}-deployment`,
        type: 'deployment',
        baseAgent,
        governanceConfig: {
          ...governanceConfig,
          // Deployment version uses full governance
          emergencyControls: true,
        },
        governanceEngine,
        metadata: {
          name: `${systemConfig.name} (Deployment)`,
          description: `Production-ready version of ${systemConfig.name} multi-agent system`,
          version: '1.0.0',
          createdAt: now,
          updatedAt: now,
          tags: ['deployment', 'multi-agent', systemConfig.type, options.deploymentTarget],
          multiAgentConfig: {
            systemType: systemConfig.type,
            agents: systemConfig.agents,
            roles: systemConfig.roles,
            connections: systemConfig.connections,
            collaborationModel: systemConfig.collaborationModel,
            governanceRules: systemConfig.governanceRules,
          }
        },
        status: {
          isActive: true,
          lastUsed: now,
          usageCount: 0,
          errorCount: 0,
          lastError: null,
        },
        deploymentConfig: {
          target: options.deploymentTarget,
          packageFormat: 'multi-agent-system',
          dependencies: systemConfig.agents,
          environmentVariables: {},
          scalingConfig: {
            minInstances: 1,
            maxInstances: 10,
            targetCPU: 70,
          },
        },
      };
    }

    // Create the dual wrapper
    const dualWrapper: DualAgentWrapper = {
      id: wrapperId,
      baseAgent,
      testingWrapper,
      deploymentWrapper,
      metadata: {
        name: systemConfig.name,
        description: systemConfig.description,
        version: '1.0.0',
        createdAt: now,
        updatedAt: now,
        tags: ['multi-agent', systemConfig.type],
        multiAgentConfig: {
          systemType: systemConfig.type,
          agents: systemConfig.agents,
          roles: systemConfig.roles,
          connections: systemConfig.connections,
          collaborationModel: systemConfig.collaborationModel,
          governanceRules: systemConfig.governanceRules,
        }
      },
      status: {
        testingStatus: testingWrapper ? 'ready' : 'disabled',
        deploymentStatus: deploymentWrapper ? 'ready' : 'disabled',
        lastSync: now,
        syncErrors: [],
      },
    };

    // Store in memory and persistent storage
    this.dualWrappers.set(wrapperId, dualWrapper);
    await this.storage.storeWrapper(dualWrapper);

    // Create legacy wrapper for backward compatibility
    await this.createLegacyWrapper(dualWrapper);

    // Store governance engine if created
    if (deploymentWrapper?.governanceEngine) {
      this.governanceEngines.set(wrapperId, deploymentWrapper.governanceEngine);
    }

    console.log(`🤖 Created multi-agent dual wrapper: ${systemConfig.name} (${wrapperId})`);
    console.log(`   Testing: ${testingWrapper ? '✅' : '❌'}`);
    console.log(`   Deployment: ${deploymentWrapper ? '✅' : '❌'}`);
    console.log(`   Agents: ${systemConfig.agents.length}`);
    console.log(`   Collaboration: ${systemConfig.collaborationModel}`);

    return dualWrapper;
  }

  /**
   * Get multi-agent systems with dual wrapper support
   */
  async getMultiAgentDualWrappers(userId: string): Promise<DualAgentWrapper[]> {
    this.setCurrentUser(userId);
    
    const allWrappers = await this.listDualWrappers({
      tags: ['multi-agent'],
      limit: 100,
    });

    return allWrappers.wrappers.filter(wrapper => 
      wrapper.metadata.multiAgentConfig !== undefined
    );
  }

  /**
   * Update multi-agent system configuration
   */
  async updateMultiAgentDualWrapper(
    userId: string,
    wrapperId: string,
    updates: {
      systemConfig?: any;
      governanceConfig?: Partial<GovernanceConfiguration>;
      regenerateDeployment?: boolean;
    }
  ): Promise<void> {
    this.setCurrentUser(userId);

    const wrapper = await this.getDualWrapper(wrapperId);
    if (!wrapper || !wrapper.metadata.multiAgentConfig) {
      throw new Error(`Multi-agent dual wrapper not found: ${wrapperId}`);
    }

    const now = new Date().toISOString();
    const updateRequest: UpdateDualWrapperRequest = {
      wrapperId,
      updates: {
        metadata: {
          ...wrapper.metadata,
          updatedAt: now,
          multiAgentConfig: updates.systemConfig ? {
            ...wrapper.metadata.multiAgentConfig,
            ...updates.systemConfig,
          } : wrapper.metadata.multiAgentConfig,
        },
        governanceConfig: updates.governanceConfig,
      },
      regenerateDeployment: updates.regenerateDeployment || false,
    };

    await this.updateDualWrapper(updateRequest);
  }


}

