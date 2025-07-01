/**
 * Enhanced Multi-Agent System Registry
 * 
 * Advanced registry that extends the existing MultiAgentSystemRegistry to support
 * dual-wrapping patterns, collaborative governance, and system-level compliance
 * monitoring for multi-agent systems.
 * 
 * @author Manus AI
 * @version 1.0.0
 */

import {
  EnhancedMultiAgentSystem,
  MultiAgentDualWrapper,
  EnhancedAgentRole,
  EnhancedAgentConnection,
  MultiAgentCollaborationSession,
  MultiAgentDeploymentPackage,
  MultiAgentSystemRegistryEntry,
  CreateMultiAgentDualWrapperRequest,
  UpdateMultiAgentDualWrapperRequest,
  MultiAgentQueryFilters,
  MultiAgentQueryResult
} from '../types/enhancedMultiAgent';
import { MultiAgentSystemRegistry } from './MultiAgentSystemRegistry';
import { DualAgentWrapperRegistry } from './DualAgentWrapperRegistry';
import { MultiAgentGovernanceEngine, MultiAgentGovernanceConfig } from './governance/MultiAgentGovernanceEngine';
import { UnifiedStorageService } from '../../../services/UnifiedStorageService';
import { GovernanceConfiguration } from '../types/dualWrapper';

/**
 * Enhanced registry for multi-agent systems with dual-wrapping support
 */
export class EnhancedMultiAgentSystemRegistry extends MultiAgentSystemRegistry {
  private dualWrappers: Map<string, MultiAgentDualWrapper> = new Map();
  private collaborationSessions: Map<string, MultiAgentCollaborationSession> = new Map();
  private governanceEngines: Map<string, MultiAgentGovernanceEngine> = new Map();
  private registryEntries: Map<string, MultiAgentSystemRegistryEntry> = new Map();
  
  private dualWrapperRegistry: DualAgentWrapperRegistry;
  private storage: UnifiedStorageService;
  private currentUserId: string | null = null;

  constructor() {
    super();
    this.storage = new UnifiedStorageService();
    this.dualWrapperRegistry = new DualAgentWrapperRegistry(this.storage as any);
  }

  /**
   * Set the current user context
   */
  setCurrentUser(userId: string): void {
    this.currentUserId = userId;
    this.dualWrapperRegistry.setCurrentUser(userId);
  }

  /**
   * Create an enhanced multi-agent system with dual-wrapping
   */
  async createEnhancedMultiAgentSystem(request: CreateMultiAgentDualWrapperRequest): Promise<MultiAgentDualWrapper> {
    if (!this.currentUserId) {
      throw new Error('User context required for system creation');
    }

    const systemId = `enhanced-mas-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    // Create enhanced multi-agent system configuration
    const enhancedSystem: EnhancedMultiAgentSystem = {
      ...this.createBaseSystem(request.systemConfig, systemId),
      dualWrappingConfig: {
        enabled: true,
        governanceLevel: request.options.governanceLevel,
        deploymentTarget: request.options.deploymentTarget,
      },
      enhancedGovernanceRules: request.systemConfig.governanceRules,
      systemMetadata: {
        version: '1.0.0',
        createdAt: now,
        updatedAt: now,
        tags: ['enhanced', 'dual-wrapped', request.systemConfig.systemType],
        collaborationModel: request.systemConfig.collaborationModel,
        systemType: request.systemConfig.systemType,
        totalAgents: request.systemConfig.agents.length,
        activeAgents: request.systemConfig.agents,
      },
    };

    // Create testing system if requested
    let testingSystem = null;
    if (request.options.createTesting) {
      testingSystem = {
        id: `${systemId}-testing`,
        type: 'testing' as const,
        system: {
          ...enhancedSystem,
          enhancedGovernanceRules: {
            ...enhancedSystem.enhancedGovernanceRules,
            // Lighter governance for testing
            systemLevelPolicies: {
              ...enhancedSystem.enhancedGovernanceRules.systemLevelPolicies,
              emergencyStopEnabled: false,
            },
          },
        },
        governanceConfig: {
          ...request.governanceConfig,
          emergencyControls: false,
        },
        metadata: {
          name: `${request.systemConfig.name} (Testing)`,
          description: `Testing version of ${request.systemConfig.name}`,
          version: '1.0.0',
          createdAt: now,
          updatedAt: now,
          tags: ['testing', 'multi-agent'],
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

    // Create deployment system if requested
    let deploymentSystem = null;
    if (request.options.createDeployment) {
      // Create governance engine for deployment
      const governanceEngine = new MultiAgentGovernanceEngine(enhancedSystem.enhancedGovernanceRules);

      deploymentSystem = {
        id: `${systemId}-deployment`,
        type: 'deployment' as const,
        system: enhancedSystem,
        governanceConfig: request.governanceConfig,
        governanceEngine,
        metadata: {
          name: `${request.systemConfig.name} (Deployment)`,
          description: `Production-ready version of ${request.systemConfig.name}`,
          version: '1.0.0',
          createdAt: now,
          updatedAt: now,
          tags: ['deployment', 'multi-agent', request.options.deploymentTarget],
        },
        status: {
          isActive: true,
          lastUsed: now,
          usageCount: 0,
          errorCount: 0,
          lastError: null,
        },
        deploymentConfig: {
          target: request.options.deploymentTarget,
          packageFormat: 'multi-agent-system',
          dependencies: request.systemConfig.agents,
          environmentVariables: {},
          scalingConfig: {
            minInstances: 1,
            maxInstances: Math.max(2, request.systemConfig.agents.length),
            targetCPU: 70,
          },
        },
      };

      // Store governance engine
      this.governanceEngines.set(systemId, governanceEngine);
    }

    // Create the dual wrapper
    const dualWrapper: MultiAgentDualWrapper = {
      id: systemId,
      baseSystem: enhancedSystem,
      testingSystem,
      deploymentSystem,
      metadata: {
        name: request.systemConfig.name,
        description: request.systemConfig.description,
        version: '1.0.0',
        createdAt: now,
        updatedAt: now,
        tags: ['enhanced', 'multi-agent', request.systemConfig.systemType],
        systemType: request.systemConfig.systemType,
        collaborationModel: request.systemConfig.collaborationModel,
        totalAgents: request.systemConfig.agents.length,
      },
      status: {
        testingStatus: testingSystem ? 'ready' : 'disabled',
        deploymentStatus: deploymentSystem ? 'ready' : 'disabled',
        lastSync: now,
        syncErrors: [],
      },
    };

    // Create registry entry
    const registryEntry: MultiAgentSystemRegistryEntry = {
      id: systemId,
      userId: this.currentUserId,
      systemInfo: {
        name: request.systemConfig.name,
        description: request.systemConfig.description,
        version: '1.0.0',
        systemType: request.systemConfig.systemType,
        collaborationModel: request.systemConfig.collaborationModel,
        status: 'testing',
      },
      dualWrapper,
      usageStats: {
        totalSessions: 0,
        totalInteractions: 0,
        averageSessionDuration: 0,
        lastUsed: now,
        deploymentCount: 0,
      },
      governanceSummary: {
        overallComplianceRate: 1.0,
        totalViolations: 0,
        criticalViolations: 0,
        averageTrustScore: 0.85,
        emergencyStopsTriggered: 0,
        lastGovernanceReview: now,
      },
      metadata: {
        createdAt: now,
        updatedAt: now,
        tags: ['enhanced', 'multi-agent'],
        owner: this.currentUserId,
        collaborators: [],
        visibility: 'private',
      },
    };

    // Store in memory and persistent storage
    this.dualWrappers.set(systemId, dualWrapper);
    this.registryEntries.set(systemId, registryEntry);
    
    await this.storage.set('agents', `enhanced-multi-agent-system-${systemId}`, dualWrapper);
    await this.storage.set('agents', `enhanced-multi-agent-registry-${systemId}`, registryEntry);

    // Update user's system list
    await this.updateUserSystemList(this.currentUserId, systemId, 'add');

    console.log(`🤖 Created enhanced multi-agent system: ${request.systemConfig.name} (${systemId})`);
    console.log(`   Testing: ${testingSystem ? '✅' : '❌'}`);
    console.log(`   Deployment: ${deploymentSystem ? '✅' : '❌'}`);
    console.log(`   Agents: ${request.systemConfig.agents.length}`);
    console.log(`   Collaboration: ${request.systemConfig.collaborationModel}`);

    return dualWrapper;
  }

  /**
   * Get enhanced multi-agent system by ID
   */
  async getEnhancedMultiAgentSystem(systemId: string): Promise<MultiAgentDualWrapper | null> {
    // Check memory first
    if (this.dualWrappers.has(systemId)) {
      return this.dualWrappers.get(systemId)!;
    }

    // Load from storage
    try {
      const stored = await this.storage.get('agents', `enhanced-multi-agent-system-${systemId}`);
      if (stored) {
        this.dualWrappers.set(systemId, stored);
        return stored;
      }
    } catch (error) {
      console.error(`Error loading enhanced multi-agent system ${systemId}:`, error);
    }

    return null;
  }

  /**
   * Update enhanced multi-agent system
   */
  async updateEnhancedMultiAgentSystem(request: UpdateMultiAgentDualWrapperRequest): Promise<void> {
    const system = await this.getEnhancedMultiAgentSystem(request.wrapperId);
    if (!system) {
      throw new Error(`Enhanced multi-agent system not found: ${request.wrapperId}`);
    }

    const now = new Date().toISOString();
    const updates: Partial<MultiAgentDualWrapper> = {};

    // Update metadata
    if (request.updates.metadata) {
      updates.metadata = {
        ...system.metadata,
        ...request.updates.metadata,
        updatedAt: now,
      };
    }

    // Update system configuration
    if (request.updates.systemConfig) {
      updates.baseSystem = {
        ...system.baseSystem,
        ...request.updates.systemConfig,
        systemMetadata: {
          ...system.baseSystem.systemMetadata,
          updatedAt: now,
        },
      };

      // Update testing system if it exists
      if (system.testingSystem) {
        updates.testingSystem = {
          ...system.testingSystem,
          system: {
            ...system.testingSystem.system,
            ...request.updates.systemConfig,
          },
          metadata: {
            ...system.testingSystem.metadata,
            updatedAt: now,
          },
        };
      }

      // Update deployment system if it exists
      if (system.deploymentSystem) {
        updates.deploymentSystem = {
          ...system.deploymentSystem,
          system: {
            ...system.deploymentSystem.system,
            ...request.updates.systemConfig,
          },
          metadata: {
            ...system.deploymentSystem.metadata,
            updatedAt: now,
          },
        };
      }
    }

    // Update governance configuration
    if (request.updates.governanceConfig) {
      if (system.testingSystem) {
        updates.testingSystem = {
          ...system.testingSystem,
          governanceConfig: {
            ...system.testingSystem.governanceConfig,
            ...request.updates.governanceConfig,
          },
        };
      }

      if (system.deploymentSystem) {
        updates.deploymentSystem = {
          ...system.deploymentSystem,
          governanceConfig: {
            ...system.deploymentSystem.governanceConfig,
            ...request.updates.governanceConfig,
          },
        };

        // Regenerate governance engine if requested
        if (request.regenerateDeployment) {
          const newGovernanceEngine = new MultiAgentGovernanceEngine(
            system.baseSystem.enhancedGovernanceRules
          );
          updates.deploymentSystem.governanceEngine = newGovernanceEngine;
          this.governanceEngines.set(request.wrapperId, newGovernanceEngine);
        }
      }
    }

    // Apply updates
    const updatedSystem = { ...system, ...updates };
    this.dualWrappers.set(request.wrapperId, updatedSystem);
    await this.storage.set('agents', `enhanced-multi-agent-system-${request.wrapperId}`, updatedSystem);

    // Update registry entry
    const registryEntry = this.registryEntries.get(request.wrapperId);
    if (registryEntry) {
      const updatedEntry = {
        ...registryEntry,
        dualWrapper: updatedSystem,
        metadata: {
          ...registryEntry.metadata,
          updatedAt: now,
        },
      };
      this.registryEntries.set(request.wrapperId, updatedEntry);
      await this.storage.set('agents', `enhanced-multi-agent-registry-${request.wrapperId}`, updatedEntry);
    }

    console.log(`🔄 Updated enhanced multi-agent system: ${updatedSystem.metadata.name} (${request.wrapperId})`);
  }

  /**
   * Delete enhanced multi-agent system
   */
  async deleteEnhancedMultiAgentSystem(systemId: string): Promise<void> {
    const system = await this.getEnhancedMultiAgentSystem(systemId);
    if (!system) {
      throw new Error(`Enhanced multi-agent system not found: ${systemId}`);
    }

    // Remove from memory
    this.dualWrappers.delete(systemId);
    this.registryEntries.delete(systemId);
    this.governanceEngines.delete(systemId);

    // Remove from storage
    await this.storage.delete('agents', `enhanced-multi-agent-system-${systemId}`);
    await this.storage.delete('agents', `enhanced-multi-agent-registry-${systemId}`);

    // Update user's system list
    if (this.currentUserId) {
      await this.updateUserSystemList(this.currentUserId, systemId, 'remove');
    }

    console.log(`🗑️ Deleted enhanced multi-agent system: ${system.metadata.name} (${systemId})`);
  }

  /**
   * Query enhanced multi-agent systems
   */
  async queryEnhancedMultiAgentSystems(filters: MultiAgentQueryFilters): Promise<MultiAgentQueryResult> {
    if (!this.currentUserId) {
      throw new Error('User context required for querying systems');
    }

    // Load user's systems
    const userSystems = await this.getUserSystemList(this.currentUserId);
    const systems: MultiAgentDualWrapper[] = [];

    for (const systemId of userSystems) {
      const system = await this.getEnhancedMultiAgentSystem(systemId);
      if (system && this.matchesFilters(system, filters)) {
        systems.push(system);
      }
    }

    // Apply pagination
    const offset = filters.offset || 0;
    const limit = filters.limit || 50;
    const paginatedSystems = systems.slice(offset, offset + limit);

    return {
      systems: paginatedSystems,
      total: systems.length,
      hasMore: offset + limit < systems.length,
      filters,
    };
  }

  /**
   * Start collaboration session
   */
  async startCollaborationSession(
    systemId: string,
    sessionType: 'testing' | 'deployment' | 'validation',
    initiatedBy: string
  ): Promise<MultiAgentCollaborationSession> {
    const system = await this.getEnhancedMultiAgentSystem(systemId);
    if (!system) {
      throw new Error(`Enhanced multi-agent system not found: ${systemId}`);
    }

    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    const session: MultiAgentCollaborationSession = {
      id: sessionId,
      systemId,
      systemName: system.metadata.name,
      metadata: {
        startedAt: now,
        initiatedBy,
        sessionType,
      },
      participants: system.baseSystem.systemMetadata.activeAgents.map(agentId => ({
        agentId,
        role: system.baseSystem.agentRoles?.[agentId] as EnhancedAgentRole || {} as EnhancedAgentRole,
        joinedAt: now,
        status: 'active' as const,
      })),
      collaborationFlow: {
        currentStep: 0,
        totalSteps: system.baseSystem.systemMetadata.activeAgents.length,
        flowType: system.baseSystem.systemMetadata.systemType,
        stepHistory: [],
      },
      governanceTracking: {
        policiesApplied: [],
        violationsDetected: [],
        trustScores: {},
        complianceRate: 1.0,
        emergencyStopsTriggered: 0,
      },
      performanceMetrics: {
        totalInteractions: 0,
        averageResponseTime: 0,
        successRate: 1.0,
        errorRate: 0,
        consensusAchievementRate: 1.0,
        collaborationEfficiency: 0.85,
      },
    };

    this.collaborationSessions.set(sessionId, session);
    await this.storage.set('agents', `collaboration-session-${sessionId}`, session);

    console.log(`🚀 Started collaboration session: ${sessionId} for system ${systemId}`);
    return session;
  }

  /**
   * Create deployment package
   */
  async createDeploymentPackage(systemId: string): Promise<MultiAgentDeploymentPackage> {
    const system = await this.getEnhancedMultiAgentSystem(systemId);
    if (!system || !system.deploymentSystem) {
      throw new Error(`Deployment system not found: ${systemId}`);
    }

    const packageId = `package-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    const deploymentPackage: MultiAgentDeploymentPackage = {
      id: packageId,
      systemId,
      metadata: {
        name: `${system.metadata.name}-deployment`,
        version: system.metadata.version,
        description: `Deployment package for ${system.metadata.name}`,
        createdAt: now,
        packageFormat: 'multi-agent-system',
        targetEnvironment: system.deploymentSystem.deploymentConfig.target,
      },
      systemConfig: system.deploymentSystem.system,
      agentConfigs: {}, // Would be populated with actual agent configurations
      deploymentArtifacts: {
        configFiles: [
          {
            filename: 'system-config.json',
            content: JSON.stringify(system.deploymentSystem.system, null, 2),
            type: 'json',
          },
          {
            filename: 'governance-config.json',
            content: JSON.stringify(system.deploymentSystem.governanceConfig, null, 2),
            type: 'json',
          },
        ],
      },
      runtimeConfig: {
        environmentVariables: system.deploymentSystem.deploymentConfig.environmentVariables,
        secrets: {},
        scalingConfig: system.deploymentSystem.deploymentConfig.scalingConfig,
        networkConfig: {
          allowedPorts: [8080, 8443],
          securityGroups: [],
        },
        monitoringConfig: {
          metricsEnabled: true,
          loggingLevel: 'info',
          alertingEnabled: true,
          healthCheckInterval: 30,
        },
      },
      governancePackage: {
        policies: [],
        trustConfigurations: [],
        complianceRules: [],
        auditConfiguration: {},
        emergencyProcedures: [],
      },
    };

    await this.storage.set('agents', `deployment-package-${packageId}`, deploymentPackage);

    console.log(`📦 Created deployment package: ${packageId} for system ${systemId}`);
    return deploymentPackage;
  }

  /**
   * Helper methods
   */
  private createBaseSystem(config: any, systemId: string): EnhancedMultiAgentSystem {
    const now = new Date().toISOString();
    
    return {
      id: systemId,
      name: config.name,
      description: config.description,
      agentIds: config.agents,
      agentRoles: config.roles,
      connections: config.connections,
      governanceRules: {}, // Legacy field
      status: 'active',
      createdAt: now,
      updatedAt: now,
      dualWrappingConfig: {
        enabled: true,
        governanceLevel: 'standard',
        deploymentTarget: 'both',
      },
      enhancedGovernanceRules: config.governanceRules,
      systemMetadata: {
        version: '1.0.0',
        createdAt: now,
        updatedAt: now,
        tags: [],
        collaborationModel: config.collaborationModel,
        systemType: config.systemType,
        totalAgents: config.agents.length,
        activeAgents: config.agents,
      },
    };
  }

  private matchesFilters(system: MultiAgentDualWrapper, filters: MultiAgentQueryFilters): boolean {
    if (filters.systemType && system.metadata.systemType !== filters.systemType) return false;
    if (filters.collaborationModel && system.metadata.collaborationModel !== filters.collaborationModel) return false;
    if (filters.minAgents && system.metadata.totalAgents < filters.minAgents) return false;
    if (filters.maxAgents && system.metadata.totalAgents > filters.maxAgents) return false;
    if (filters.tags && !filters.tags.some(tag => system.metadata.tags.includes(tag))) return false;
    
    return true;
  }

  private async updateUserSystemList(userId: string, systemId: string, operation: 'add' | 'remove'): Promise<void> {
    const userSystems = await this.getUserSystemList(userId);
    
    if (operation === 'add' && !userSystems.includes(systemId)) {
      userSystems.push(systemId);
    } else if (operation === 'remove') {
      const index = userSystems.indexOf(systemId);
      if (index > -1) {
        userSystems.splice(index, 1);
      }
    }
    
    await this.storage.set('user', `enhanced-multi-agent-systems`, userSystems);
  }

  private async getUserSystemList(userId: string): Promise<string[]> {
    try {
      return await this.storage.get('user', `enhanced-multi-agent-systems`) || [];
    } catch (error) {
      console.error('Error loading user system list:', error);
      return [];
    }
  }
}

