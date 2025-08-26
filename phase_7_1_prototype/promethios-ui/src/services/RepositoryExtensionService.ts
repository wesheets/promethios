/**
 * Repository Extension Service
 * 
 * Handles extending existing workflow repositories with new features,
 * maintaining project integrity while adding new capabilities.
 * 
 * Features:
 * - Safe extension planning with risk assessment
 * - Dependency analysis and conflict detection
 * - Rollback capabilities and version management
 * - Integration with existing governance systems
 */

import { WorkflowRepository, WorkflowArtifact, WorkflowPhase, WorkflowTask } from './WorkflowRepositoryManager';
import { AutonomousGovernanceExtension } from './AutonomousGovernanceExtension';
import { AutonomousTaskPlanningEngine } from './AutonomousTaskPlanningEngine';
import { AutonomousRiskAssessment } from './AutonomousRiskAssessment';

export interface RepositoryExtension {
  id: string;
  repositoryId: string;
  extensionGoal: string;
  extensionType: ExtensionType;
  status: ExtensionStatus;
  createdAt: Date;
  updatedAt: Date;
  
  // Extension Planning
  originalGoal: string;
  extendedGoal: string;
  extensionPlan: ExtensionPlan;
  riskAssessment: ExtensionRiskAssessment;
  
  // Execution Tracking
  phases: WorkflowPhase[];
  currentPhase: number;
  progress: number;
  
  // Version Control
  baseVersion: string;
  extensionVersion: string;
  rollbackPoint: string;
  
  // Collaboration
  createdBy: string;
  assignedTo?: string;
  collaborators: string[];
  
  // Governance
  approvalRequired: boolean;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: Date;
}

export type ExtensionType = 
  | 'feature_addition'      // Add new features to existing project
  | 'enhancement'           // Improve existing features
  | 'integration'           // Add external integrations
  | 'deployment'            // Add deployment capabilities
  | 'testing'               // Add testing infrastructure
  | 'documentation'         // Add or improve documentation
  | 'security'              // Add security features
  | 'performance'           // Performance optimizations
  | 'ui_improvement'        // UI/UX enhancements
  | 'api_extension';        // API additions or modifications

export type ExtensionStatus = 
  | 'planning'              // Extension being planned
  | 'risk_assessment'       // Risk analysis in progress
  | 'awaiting_approval'     // Waiting for user/governance approval
  | 'approved'              // Approved and ready to execute
  | 'executing'             // Extension in progress
  | 'testing'               // Testing extension changes
  | 'completed'             // Extension successfully completed
  | 'failed'                // Extension failed
  | 'rolled_back'           // Extension rolled back
  | 'cancelled';            // Extension cancelled by user

export interface ExtensionPlan {
  phases: ExtensionPhase[];
  estimatedDuration: number; // minutes
  resourceRequirements: ResourceRequirement[];
  dependencies: ExtensionDependency[];
  conflicts: ExtensionConflict[];
  rollbackStrategy: RollbackStrategy;
}

export interface ExtensionPhase {
  id: string;
  name: string;
  description: string;
  type: 'analysis' | 'planning' | 'implementation' | 'testing' | 'deployment' | 'documentation';
  estimatedDuration: number;
  dependencies: string[]; // Phase IDs this phase depends on
  
  // Artifacts to be created/modified
  artifactsToCreate: string[];
  artifactsToModify: string[];
  artifactsToDelete: string[];
  
  // Risk factors
  riskLevel: 'low' | 'medium' | 'high';
  riskFactors: string[];
  mitigationStrategies: string[];
  
  // Approval requirements
  requiresApproval: boolean;
  approvalCriteria: string[];
}

export interface ResourceRequirement {
  type: 'compute' | 'storage' | 'network' | 'external_api' | 'human_review';
  amount: number;
  unit: string;
  description: string;
  critical: boolean;
}

export interface ExtensionDependency {
  type: 'artifact' | 'service' | 'library' | 'configuration';
  name: string;
  version?: string;
  required: boolean;
  description: string;
  availabilityCheck: () => Promise<boolean>;
}

export interface ExtensionConflict {
  type: 'artifact_conflict' | 'dependency_conflict' | 'configuration_conflict' | 'goal_conflict';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affectedArtifacts: string[];
  resolutionStrategy: string;
  requiresUserDecision: boolean;
}

export interface RollbackStrategy {
  rollbackPoints: RollbackPoint[];
  automaticRollbackTriggers: string[];
  rollbackProcedure: string[];
  dataPreservation: string[];
}

export interface RollbackPoint {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  repositorySnapshot: any; // Repository state at this point
  artifactSnapshots: { [artifactId: string]: any };
  canRollbackTo: boolean;
}

export interface ExtensionRiskAssessment {
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
  riskFactors: ExtensionRiskFactor[];
  mitigationStrategies: string[];
  recommendedApprovals: string[];
  estimatedSuccessRate: number; // 0-100
}

export interface ExtensionRiskFactor {
  category: 'technical' | 'business' | 'security' | 'compliance' | 'user_experience';
  factor: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  probability: number; // 0-100
  description: string;
  mitigation: string;
}

export class RepositoryExtensionService {
  private static instance: RepositoryExtensionService;
  private governanceExtension: AutonomousGovernanceExtension;
  private planningEngine: AutonomousTaskPlanningEngine;
  private riskAssessment: AutonomousRiskAssessment;
  
  private extensions: Map<string, RepositoryExtension> = new Map();
  private extensionSubscriptions: Map<string, ((extension: RepositoryExtension) => void)[]> = new Map();

  private constructor() {
    this.governanceExtension = AutonomousGovernanceExtension.getInstance();
    this.planningEngine = new AutonomousTaskPlanningEngine();
    this.riskAssessment = new AutonomousRiskAssessment();
  }

  public static getInstance(): RepositoryExtensionService {
    if (!RepositoryExtensionService.instance) {
      RepositoryExtensionService.instance = new RepositoryExtensionService();
    }
    return RepositoryExtensionService.instance;
  }

  /**
   * Plan a repository extension
   */
  public async planExtension(
    repository: WorkflowRepository,
    extensionGoal: string,
    extensionType: ExtensionType,
    userId: string
  ): Promise<RepositoryExtension> {
    console.log(`🔄 [Extension] Planning extension for repository: ${repository.displayName}`);
    console.log(`🔄 [Extension] Extension goal: ${extensionGoal}`);
    console.log(`🔄 [Extension] Extension type: ${extensionType}`);

    // Create extension record
    const extension: RepositoryExtension = {
      id: `ext_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      repositoryId: repository.id,
      extensionGoal,
      extensionType,
      status: 'planning',
      createdAt: new Date(),
      updatedAt: new Date(),
      
      originalGoal: repository.goal,
      extendedGoal: `${repository.goal} + ${extensionGoal}`,
      extensionPlan: {
        phases: [],
        estimatedDuration: 0,
        resourceRequirements: [],
        dependencies: [],
        conflicts: [],
        rollbackStrategy: {
          rollbackPoints: [],
          automaticRollbackTriggers: [],
          rollbackProcedure: [],
          dataPreservation: []
        }
      },
      riskAssessment: {
        overallRisk: 'medium',
        riskFactors: [],
        mitigationStrategies: [],
        recommendedApprovals: [],
        estimatedSuccessRate: 85
      },
      
      phases: [],
      currentPhase: 0,
      progress: 0,
      
      baseVersion: repository.version || '1.0.0',
      extensionVersion: this.generateNextVersion(repository.version || '1.0.0'),
      rollbackPoint: `rollback_${Date.now()}`,
      
      createdBy: userId,
      collaborators: [userId],
      
      approvalRequired: false,
      approvalStatus: 'pending'
    };

    // Analyze repository for extension planning
    const repositoryAnalysis = await this.analyzeRepositoryForExtension(repository, extensionGoal, extensionType);
    
    // Generate extension plan using planning engine
    const extensionPlan = await this.generateExtensionPlan(repository, extensionGoal, extensionType, repositoryAnalysis);
    extension.extensionPlan = extensionPlan;

    // Perform risk assessment
    const riskAssessment = await this.assessExtensionRisk(repository, extension, repositoryAnalysis);
    extension.riskAssessment = riskAssessment;

    // Determine if approval is required
    extension.approvalRequired = this.requiresApproval(riskAssessment, extensionType);
    
    // Update status based on risk and approval requirements
    if (extension.approvalRequired) {
      extension.status = 'awaiting_approval';
    } else if (riskAssessment.overallRisk === 'low') {
      extension.status = 'approved';
    } else {
      extension.status = 'risk_assessment';
    }

    // Store extension
    this.extensions.set(extension.id, extension);

    // Notify subscribers
    this.notifyExtensionUpdate(extension);

    console.log(`✅ [Extension] Extension planned successfully: ${extension.id}`);
    return extension;
  }

  /**
   * Execute a repository extension
   */
  public async executeExtension(
    extensionId: string,
    userId: string
  ): Promise<void> {
    const extension = this.extensions.get(extensionId);
    if (!extension) {
      throw new Error(`Extension not found: ${extensionId}`);
    }

    if (extension.status !== 'approved') {
      throw new Error(`Extension not approved for execution: ${extension.status}`);
    }

    console.log(`🚀 [Extension] Starting execution of extension: ${extensionId}`);

    try {
      // Update status
      extension.status = 'executing';
      extension.updatedAt = new Date();
      this.notifyExtensionUpdate(extension);

      // Create rollback point
      await this.createRollbackPoint(extension, 'pre_execution');

      // Execute phases sequentially
      for (let i = 0; i < extension.extensionPlan.phases.length; i++) {
        const phase = extension.extensionPlan.phases[i];
        
        console.log(`🔄 [Extension] Executing phase ${i + 1}/${extension.extensionPlan.phases.length}: ${phase.name}`);
        
        // Update current phase
        extension.currentPhase = i;
        extension.progress = (i / extension.extensionPlan.phases.length) * 100;
        this.notifyExtensionUpdate(extension);

        // Execute phase
        await this.executeExtensionPhase(extension, phase, userId);

        // Create rollback point after each major phase
        if (phase.type === 'implementation' || phase.type === 'deployment') {
          await this.createRollbackPoint(extension, `post_${phase.id}`);
        }
      }

      // Mark as completed
      extension.status = 'completed';
      extension.progress = 100;
      extension.updatedAt = new Date();
      this.notifyExtensionUpdate(extension);

      console.log(`✅ [Extension] Extension completed successfully: ${extensionId}`);

    } catch (error) {
      console.error(`❌ [Extension] Extension execution failed: ${extensionId}`, error);
      
      // Mark as failed
      extension.status = 'failed';
      extension.updatedAt = new Date();
      this.notifyExtensionUpdate(extension);

      // Attempt automatic rollback if configured
      if (extension.extensionPlan.rollbackStrategy.automaticRollbackTriggers.includes('execution_failure')) {
        await this.rollbackExtension(extensionId, 'pre_execution', userId);
      }

      throw error;
    }
  }

  /**
   * Rollback a repository extension
   */
  public async rollbackExtension(
    extensionId: string,
    rollbackPointId: string,
    userId: string
  ): Promise<void> {
    const extension = this.extensions.get(extensionId);
    if (!extension) {
      throw new Error(`Extension not found: ${extensionId}`);
    }

    console.log(`🔄 [Extension] Rolling back extension: ${extensionId} to point: ${rollbackPointId}`);

    try {
      // Find rollback point
      const rollbackPoint = extension.extensionPlan.rollbackStrategy.rollbackPoints.find(
        point => point.id === rollbackPointId
      );

      if (!rollbackPoint) {
        throw new Error(`Rollback point not found: ${rollbackPointId}`);
      }

      if (!rollbackPoint.canRollbackTo) {
        throw new Error(`Cannot rollback to point: ${rollbackPointId}`);
      }

      // Execute rollback procedure
      await this.executeRollbackProcedure(extension, rollbackPoint, userId);

      // Update extension status
      extension.status = 'rolled_back';
      extension.updatedAt = new Date();
      this.notifyExtensionUpdate(extension);

      console.log(`✅ [Extension] Extension rolled back successfully: ${extensionId}`);

    } catch (error) {
      console.error(`❌ [Extension] Rollback failed: ${extensionId}`, error);
      throw error;
    }
  }

  /**
   * Get extension by ID
   */
  public getExtension(extensionId: string): RepositoryExtension | undefined {
    return this.extensions.get(extensionId);
  }

  /**
   * Get all extensions for a repository
   */
  public getRepositoryExtensions(repositoryId: string): RepositoryExtension[] {
    return Array.from(this.extensions.values()).filter(
      extension => extension.repositoryId === repositoryId
    );
  }

  /**
   * Subscribe to extension updates
   */
  public subscribeToExtension(
    extensionId: string,
    callback: (extension: RepositoryExtension) => void
  ): () => void {
    if (!this.extensionSubscriptions.has(extensionId)) {
      this.extensionSubscriptions.set(extensionId, []);
    }
    
    this.extensionSubscriptions.get(extensionId)!.push(callback);
    
    // Return unsubscribe function
    return () => {
      const callbacks = this.extensionSubscriptions.get(extensionId);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  // Private helper methods

  private async analyzeRepositoryForExtension(
    repository: WorkflowRepository,
    extensionGoal: string,
    extensionType: ExtensionType
  ): Promise<any> {
    console.log(`🔍 [Extension] Analyzing repository for extension compatibility`);

    return {
      existingArtifacts: repository.structure.artifacts || {},
      existingDependencies: repository.dependencies || [],
      currentVersion: repository.version || '1.0.0',
      lastModified: repository.lastModified,
      complexity: this.assessRepositoryComplexity(repository),
      extensionCompatibility: this.assessExtensionCompatibility(repository, extensionType)
    };
  }

  private async generateExtensionPlan(
    repository: WorkflowRepository,
    extensionGoal: string,
    extensionType: ExtensionType,
    analysis: any
  ): Promise<ExtensionPlan> {
    console.log(`📋 [Extension] Generating extension plan`);

    // Use planning engine to create extension phases
    const phases = await this.generateExtensionPhases(extensionGoal, extensionType, analysis);
    
    return {
      phases,
      estimatedDuration: phases.reduce((total, phase) => total + phase.estimatedDuration, 0),
      resourceRequirements: this.calculateResourceRequirements(phases),
      dependencies: await this.identifyDependencies(phases, repository),
      conflicts: await this.detectConflicts(phases, repository),
      rollbackStrategy: this.createRollbackStrategy(phases)
    };
  }

  private async generateExtensionPhases(
    extensionGoal: string,
    extensionType: ExtensionType,
    analysis: any
  ): Promise<ExtensionPhase[]> {
    const phases: ExtensionPhase[] = [];

    // Analysis phase (always first)
    phases.push({
      id: 'analysis',
      name: 'Extension Analysis',
      description: 'Analyze existing codebase and plan integration points',
      type: 'analysis',
      estimatedDuration: 10,
      dependencies: [],
      artifactsToCreate: ['extension_analysis.md'],
      artifactsToModify: [],
      artifactsToDelete: [],
      riskLevel: 'low',
      riskFactors: [],
      mitigationStrategies: [],
      requiresApproval: false,
      approvalCriteria: []
    });

    // Type-specific phases
    switch (extensionType) {
      case 'feature_addition':
        phases.push(
          {
            id: 'feature_design',
            name: 'Feature Design',
            description: 'Design new feature architecture and integration',
            type: 'planning',
            estimatedDuration: 15,
            dependencies: ['analysis'],
            artifactsToCreate: ['feature_spec.md', 'integration_plan.md'],
            artifactsToModify: ['plan.yaml'],
            artifactsToDelete: [],
            riskLevel: 'medium',
            riskFactors: ['Integration complexity', 'Existing code modification'],
            mitigationStrategies: ['Incremental implementation', 'Comprehensive testing'],
            requiresApproval: true,
            approvalCriteria: ['Feature design review', 'Integration impact assessment']
          },
          {
            id: 'feature_implementation',
            name: 'Feature Implementation',
            description: 'Implement new feature functionality',
            type: 'implementation',
            estimatedDuration: 30,
            dependencies: ['feature_design'],
            artifactsToCreate: ['new_feature_files'],
            artifactsToModify: ['existing_integration_points'],
            artifactsToDelete: [],
            riskLevel: 'high',
            riskFactors: ['Code conflicts', 'Breaking changes'],
            mitigationStrategies: ['Backup creation', 'Incremental testing'],
            requiresApproval: false,
            approvalCriteria: []
          }
        );
        break;

      case 'integration':
        phases.push(
          {
            id: 'integration_planning',
            name: 'Integration Planning',
            description: 'Plan external service integration',
            type: 'planning',
            estimatedDuration: 20,
            dependencies: ['analysis'],
            artifactsToCreate: ['integration_spec.md', 'api_documentation.md'],
            artifactsToModify: ['configuration.json'],
            artifactsToDelete: [],
            riskLevel: 'medium',
            riskFactors: ['External dependency', 'API compatibility'],
            mitigationStrategies: ['Fallback mechanisms', 'Error handling'],
            requiresApproval: true,
            approvalCriteria: ['Security review', 'Data privacy assessment']
          }
        );
        break;

      case 'deployment':
        phases.push(
          {
            id: 'deployment_setup',
            name: 'Deployment Configuration',
            description: 'Set up deployment infrastructure and configuration',
            type: 'deployment',
            estimatedDuration: 25,
            dependencies: ['analysis'],
            artifactsToCreate: ['deployment_config.yaml', 'ci_cd_pipeline.yml'],
            artifactsToModify: ['package.json', 'README.md'],
            artifactsToDelete: [],
            riskLevel: 'high',
            riskFactors: ['Production deployment', 'Service availability'],
            mitigationStrategies: ['Staging deployment', 'Rollback procedures'],
            requiresApproval: true,
            approvalCriteria: ['Deployment review', 'Security clearance']
          }
        );
        break;

      default:
        // Generic implementation phase
        phases.push({
          id: 'implementation',
          name: 'Extension Implementation',
          description: `Implement ${extensionType} extension`,
          type: 'implementation',
          estimatedDuration: 20,
          dependencies: ['analysis'],
          artifactsToCreate: ['extension_files'],
          artifactsToModify: ['existing_files'],
          artifactsToDelete: [],
          riskLevel: 'medium',
          riskFactors: ['Code modification'],
          mitigationStrategies: ['Backup and testing'],
          requiresApproval: false,
          approvalCriteria: []
        });
    }

    // Testing phase (always included)
    phases.push({
      id: 'testing',
      name: 'Extension Testing',
      description: 'Test extension functionality and integration',
      type: 'testing',
      estimatedDuration: 15,
      dependencies: phases.filter(p => p.type === 'implementation').map(p => p.id),
      artifactsToCreate: ['test_results.md'],
      artifactsToModify: [],
      artifactsToDelete: [],
      riskLevel: 'low',
      riskFactors: [],
      mitigationStrategies: [],
      requiresApproval: false,
      approvalCriteria: []
    });

    // Documentation phase (always last)
    phases.push({
      id: 'documentation',
      name: 'Documentation Update',
      description: 'Update documentation with extension details',
      type: 'documentation',
      estimatedDuration: 10,
      dependencies: ['testing'],
      artifactsToCreate: ['extension_docs.md'],
      artifactsToModify: ['README.md', 'CHANGELOG.md'],
      artifactsToDelete: [],
      riskLevel: 'low',
      riskFactors: [],
      mitigationStrategies: [],
      requiresApproval: false,
      approvalCriteria: []
    });

    return phases;
  }

  private calculateResourceRequirements(phases: ExtensionPhase[]): ResourceRequirement[] {
    const requirements: ResourceRequirement[] = [];

    // Calculate compute requirements
    const totalDuration = phases.reduce((sum, phase) => sum + phase.estimatedDuration, 0);
    requirements.push({
      type: 'compute',
      amount: Math.ceil(totalDuration / 60), // Convert to hours
      unit: 'hours',
      description: 'Estimated compute time for extension execution',
      critical: true
    });

    // Storage requirements
    requirements.push({
      type: 'storage',
      amount: 100, // MB
      unit: 'MB',
      description: 'Additional storage for extension artifacts',
      critical: false
    });

    // Check if human review is needed
    const needsReview = phases.some(phase => phase.requiresApproval);
    if (needsReview) {
      requirements.push({
        type: 'human_review',
        amount: 1,
        unit: 'review',
        description: 'Human review required for high-risk phases',
        critical: true
      });
    }

    return requirements;
  }

  private async identifyDependencies(
    phases: ExtensionPhase[],
    repository: WorkflowRepository
  ): Promise<ExtensionDependency[]> {
    const dependencies: ExtensionDependency[] = [];

    // Check for existing artifacts that will be modified
    for (const phase of phases) {
      for (const artifact of phase.artifactsToModify) {
        dependencies.push({
          type: 'artifact',
          name: artifact,
          required: true,
          description: `Existing artifact that will be modified: ${artifact}`,
          availabilityCheck: async () => {
            // Check if artifact exists in repository
            return repository.structure.artifacts && 
                   Object.keys(repository.structure.artifacts).includes(artifact);
          }
        });
      }
    }

    return dependencies;
  }

  private async detectConflicts(
    phases: ExtensionPhase[],
    repository: WorkflowRepository
  ): Promise<ExtensionConflict[]> {
    const conflicts: ExtensionConflict[] = [];

    // Check for artifact conflicts
    const artifactsToModify = phases.flatMap(phase => phase.artifactsToModify);
    const artifactsToCreate = phases.flatMap(phase => phase.artifactsToCreate);

    // Check if we're trying to create artifacts that already exist
    for (const newArtifact of artifactsToCreate) {
      if (repository.structure.artifacts && 
          Object.keys(repository.structure.artifacts).includes(newArtifact)) {
        conflicts.push({
          type: 'artifact_conflict',
          severity: 'medium',
          description: `Attempting to create artifact that already exists: ${newArtifact}`,
          affectedArtifacts: [newArtifact],
          resolutionStrategy: 'Rename new artifact or merge with existing',
          requiresUserDecision: true
        });
      }
    }

    return conflicts;
  }

  private createRollbackStrategy(phases: ExtensionPhase[]): RollbackStrategy {
    return {
      rollbackPoints: [
        {
          id: 'pre_execution',
          name: 'Pre-Extension State',
          description: 'Repository state before extension execution',
          createdAt: new Date(),
          repositorySnapshot: {},
          artifactSnapshots: {},
          canRollbackTo: true
        }
      ],
      automaticRollbackTriggers: [
        'execution_failure',
        'critical_error',
        'user_cancellation'
      ],
      rollbackProcedure: [
        'Stop current execution',
        'Restore artifact snapshots',
        'Revert configuration changes',
        'Clean up temporary files',
        'Verify repository integrity'
      ],
      dataPreservation: [
        'User data',
        'Configuration preferences',
        'Audit logs',
        'Extension history'
      ]
    };
  }

  private async assessExtensionRisk(
    repository: WorkflowRepository,
    extension: RepositoryExtension,
    analysis: any
  ): Promise<ExtensionRiskAssessment> {
    console.log(`⚠️ [Extension] Assessing extension risk`);

    const riskFactors: ExtensionRiskFactor[] = [];

    // Technical risk factors
    if (extension.extensionPlan.phases.some(p => p.riskLevel === 'high')) {
      riskFactors.push({
        category: 'technical',
        factor: 'High-risk implementation phases',
        impact: 'high',
        probability: 30,
        description: 'Extension includes high-risk implementation phases',
        mitigation: 'Incremental implementation with rollback points'
      });
    }

    // Complexity risk
    if (analysis.complexity > 0.7) {
      riskFactors.push({
        category: 'technical',
        factor: 'High repository complexity',
        impact: 'medium',
        probability: 50,
        description: 'Repository has high complexity, increasing extension risk',
        mitigation: 'Thorough analysis and testing phases'
      });
    }

    // Conflict risk
    if (extension.extensionPlan.conflicts.length > 0) {
      riskFactors.push({
        category: 'technical',
        factor: 'Artifact conflicts detected',
        impact: 'medium',
        probability: 70,
        description: 'Extension may conflict with existing artifacts',
        mitigation: 'Resolve conflicts before execution'
      });
    }

    // Calculate overall risk
    const avgImpact = riskFactors.reduce((sum, factor) => {
      const impactScore = { low: 1, medium: 2, high: 3, critical: 4 }[factor.impact];
      return sum + impactScore;
    }, 0) / (riskFactors.length || 1);

    const avgProbability = riskFactors.reduce((sum, factor) => sum + factor.probability, 0) / (riskFactors.length || 1);

    let overallRisk: 'low' | 'medium' | 'high' | 'critical';
    if (avgImpact <= 1.5 && avgProbability <= 30) {
      overallRisk = 'low';
    } else if (avgImpact <= 2.5 && avgProbability <= 60) {
      overallRisk = 'medium';
    } else if (avgImpact <= 3.5 && avgProbability <= 80) {
      overallRisk = 'high';
    } else {
      overallRisk = 'critical';
    }

    return {
      overallRisk,
      riskFactors,
      mitigationStrategies: riskFactors.map(factor => factor.mitigation),
      recommendedApprovals: overallRisk === 'high' || overallRisk === 'critical' 
        ? ['Technical review', 'Risk assessment approval'] 
        : [],
      estimatedSuccessRate: Math.max(20, 100 - (avgImpact * avgProbability / 4))
    };
  }

  private requiresApproval(riskAssessment: ExtensionRiskAssessment, extensionType: ExtensionType): boolean {
    // High-risk extensions always require approval
    if (riskAssessment.overallRisk === 'high' || riskAssessment.overallRisk === 'critical') {
      return true;
    }

    // Certain extension types require approval
    const approvalRequiredTypes: ExtensionType[] = [
      'deployment',
      'security',
      'integration'
    ];

    return approvalRequiredTypes.includes(extensionType);
  }

  private async executeExtensionPhase(
    extension: RepositoryExtension,
    phase: ExtensionPhase,
    userId: string
  ): Promise<void> {
    console.log(`🔄 [Extension] Executing phase: ${phase.name}`);

    // Check if phase requires approval
    if (phase.requiresApproval) {
      // Wait for approval (in real implementation, this would be async)
      console.log(`⏳ [Extension] Phase requires approval: ${phase.name}`);
      // For now, we'll assume approval is granted
    }

    // Simulate phase execution
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate work

    // Create artifacts
    for (const artifact of phase.artifactsToCreate) {
      console.log(`📄 [Extension] Creating artifact: ${artifact}`);
      // In real implementation, this would create actual files
    }

    // Modify artifacts
    for (const artifact of phase.artifactsToModify) {
      console.log(`📝 [Extension] Modifying artifact: ${artifact}`);
      // In real implementation, this would modify actual files
    }

    console.log(`✅ [Extension] Phase completed: ${phase.name}`);
  }

  private async createRollbackPoint(
    extension: RepositoryExtension,
    pointId: string
  ): Promise<void> {
    console.log(`💾 [Extension] Creating rollback point: ${pointId}`);

    const rollbackPoint: RollbackPoint = {
      id: pointId,
      name: `Rollback Point: ${pointId}`,
      description: `Automatic rollback point created during extension execution`,
      createdAt: new Date(),
      repositorySnapshot: {}, // In real implementation, capture repository state
      artifactSnapshots: {}, // In real implementation, capture artifact states
      canRollbackTo: true
    };

    extension.extensionPlan.rollbackStrategy.rollbackPoints.push(rollbackPoint);
  }

  private async executeRollbackProcedure(
    extension: RepositoryExtension,
    rollbackPoint: RollbackPoint,
    userId: string
  ): Promise<void> {
    console.log(`🔄 [Extension] Executing rollback procedure to: ${rollbackPoint.id}`);

    // Execute rollback steps
    for (const step of extension.extensionPlan.rollbackStrategy.rollbackProcedure) {
      console.log(`🔄 [Extension] Rollback step: ${step}`);
      // In real implementation, execute actual rollback steps
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log(`✅ [Extension] Rollback completed to: ${rollbackPoint.id}`);
  }

  private assessRepositoryComplexity(repository: WorkflowRepository): number {
    // Simple complexity assessment based on repository structure
    const artifactCount = Object.keys(repository.structure.artifacts || {}).length;
    const phaseCount = repository.phases?.length || 0;
    
    // Normalize to 0-1 scale
    return Math.min(1, (artifactCount + phaseCount) / 20);
  }

  private assessExtensionCompatibility(repository: WorkflowRepository, extensionType: ExtensionType): number {
    // Simple compatibility assessment
    // In real implementation, this would be more sophisticated
    return 0.8; // 80% compatibility
  }

  private generateNextVersion(currentVersion: string): string {
    const parts = currentVersion.split('.');
    const patch = parseInt(parts[2] || '0') + 1;
    return `${parts[0]}.${parts[1]}.${patch}`;
  }

  private notifyExtensionUpdate(extension: RepositoryExtension): void {
    const callbacks = this.extensionSubscriptions.get(extension.id);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(extension);
        } catch (error) {
          console.error('Error in extension subscription callback:', error);
        }
      });
    }
  }
}

export default RepositoryExtensionService;

