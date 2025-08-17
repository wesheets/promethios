/**
 * Agent Role Service
 * 
 * Integrates agent role management with the Universal Governance Adapter,
 * providing both prebuilt roles from the multi-agent system and custom role creation.
 * Links roles to receipts, logs, and knowledge for complete contextual awareness.
 */

import { UniversalGovernanceAdapter } from './UniversalGovernanceAdapter';

export interface AgentRole {
  id: string;
  name: string;
  description: string;
  category: 'workflow' | 'functional' | 'communication' | 'specialized' | 'custom';
  isPrebuilt: boolean;
  permissions: string[];
  responsibilities: string[];
  governanceRequirements?: {
    required?: boolean;
    forbidden?: boolean;
    trustScoreMinimum?: number;
    complianceLevel?: 'low' | 'medium' | 'high' | 'critical';
  };
  capabilities: {
    [key: string]: {
      required: boolean;
      level: number; // 0-1 scale
    };
  };
  collaborationPatterns: string[];
  executionCharacteristics: {
    pattern: 'orchestrator' | 'worker' | 'reviewer' | 'collector' | 'analyst' | 'creator' | 'investigator' | 'auditor' | 'mediator';
    resourceIntensity: 'low' | 'medium' | 'high';
    communicationFrequency: 'low' | 'medium' | 'high' | 'very_high';
    decisionAuthority: 'low' | 'medium' | 'high';
  };
  conflictResolutionPriority: number; // 1-10, 1 = highest priority
  customConfig?: Record<string, any>;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface RoleAssignment {
  agentId: string;
  roleId: string;
  assignedAt: string;
  assignedBy: string;
  isActive: boolean;
  context?: string;
  expiresAt?: string;
}

export interface RoleValidationResult {
  valid: boolean;
  score: number; // 0-1 compatibility score
  missingCapabilities: string[];
  warnings: string[];
  recommendations: string[];
  governanceCompliance: boolean;
}

export interface RoleContextualData {
  roleId: string;
  roleName: string;
  personalityMode?: string;
  knowledgeBasesUsed: string[];
  capabilitiesUtilized: string[];
  governanceMetrics: {
    trustScore: number;
    complianceScore: number;
    policyAdherence: number;
  };
  performanceMetrics: {
    responseTime: number;
    accuracy: number;
    userSatisfaction: number;
  };
}

export class AgentRoleService {
  private universalGovernance: UniversalGovernanceAdapter;
  private prebuiltRoles: Map<string, AgentRole> = new Map();
  private customRoles: Map<string, AgentRole> = new Map();
  private roleAssignments: Map<string, RoleAssignment[]> = new Map(); // agentId -> assignments

  constructor() {
    this.universalGovernance = new UniversalGovernanceAdapter();
    this.initializePrebuiltRoles();
  }

  /**
   * Initialize prebuilt roles from the multi-agent system
   */
  private initializePrebuiltRoles(): void {
    const prebuiltRoles: AgentRole[] = [
      // Workflow Roles
      {
        id: 'coordinator',
        name: 'Coordinator',
        description: 'Manages overall workflow, delegates tasks, and ensures coordination between agents',
        category: 'workflow',
        isPrebuilt: true,
        permissions: [
          'task_delegation',
          'workflow_management',
          'agent_coordination',
          'resource_allocation',
          'priority_setting'
        ],
        responsibilities: [
          'Orchestrate multi-agent workflows',
          'Delegate tasks to appropriate agents',
          'Monitor progress and resolve bottlenecks',
          'Ensure coordination between team members',
          'Manage resource allocation and priorities'
        ],
        governanceRequirements: {
          required: true,
          trustScoreMinimum: 0.8,
          complianceLevel: 'high'
        },
        capabilities: {
          task_delegation: { required: true, level: 0.8 },
          workflow_management: { required: true, level: 0.7 },
          communication: { required: true, level: 0.8 },
          decision_making: { required: false, level: 0.7 },
          conflict_resolution: { required: false, level: 0.6 }
        },
        collaborationPatterns: ['hierarchical_coordination', 'sequential_handoffs'],
        executionCharacteristics: {
          pattern: 'orchestrator',
          resourceIntensity: 'low',
          communicationFrequency: 'high',
          decisionAuthority: 'high'
        },
        conflictResolutionPriority: 1
      },
      {
        id: 'processor',
        name: 'Processor',
        description: 'Handles main task execution and data processing operations',
        category: 'workflow',
        isPrebuilt: true,
        permissions: [
          'data_processing',
          'task_execution',
          'algorithm_implementation',
          'performance_optimization'
        ],
        responsibilities: [
          'Execute assigned tasks efficiently',
          'Process data according to specifications',
          'Implement algorithms and procedures',
          'Optimize performance and resource usage',
          'Report progress and results'
        ],
        governanceRequirements: {
          trustScoreMinimum: 0.6,
          complianceLevel: 'medium'
        },
        capabilities: {
          data_processing: { required: true, level: 0.8 },
          task_execution: { required: true, level: 0.8 },
          algorithm_implementation: { required: false, level: 0.7 },
          performance_optimization: { required: false, level: 0.6 }
        },
        collaborationPatterns: ['parallel_processing', 'sequential_handoffs'],
        executionCharacteristics: {
          pattern: 'worker',
          resourceIntensity: 'high',
          communicationFrequency: 'medium',
          decisionAuthority: 'medium'
        },
        conflictResolutionPriority: 5
      },
      {
        id: 'validator',
        name: 'Validator',
        description: 'Reviews, validates, and ensures quality of outputs from other agents',
        category: 'workflow',
        isPrebuilt: true,
        permissions: [
          'quality_assessment',
          'error_detection',
          'compliance_checking',
          'approval_authority',
          'rejection_authority'
        ],
        responsibilities: [
          'Review outputs for quality and accuracy',
          'Detect errors and inconsistencies',
          'Ensure compliance with standards',
          'Approve or reject work products',
          'Provide feedback for improvements'
        ],
        governanceRequirements: {
          required: true,
          trustScoreMinimum: 0.8,
          complianceLevel: 'high'
        },
        capabilities: {
          quality_assessment: { required: true, level: 0.8 },
          error_detection: { required: true, level: 0.8 },
          compliance_checking: { required: true, level: 0.7 },
          analytical_thinking: { required: false, level: 0.7 }
        },
        collaborationPatterns: ['sequential_handoffs', 'hierarchical_coordination'],
        executionCharacteristics: {
          pattern: 'reviewer',
          resourceIntensity: 'medium',
          communicationFrequency: 'medium',
          decisionAuthority: 'high'
        },
        conflictResolutionPriority: 2
      },
      {
        id: 'data_analyst',
        name: 'Data Analyst',
        description: 'Specializes in data analysis, statistical processing, and insight generation',
        category: 'functional',
        isPrebuilt: true,
        permissions: [
          'statistical_analysis',
          'data_visualization',
          'pattern_recognition',
          'mathematical_modeling',
          'insight_generation'
        ],
        responsibilities: [
          'Analyze data using statistical methods',
          'Create visualizations and reports',
          'Identify patterns and trends',
          'Build mathematical models',
          'Generate actionable insights'
        ],
        governanceRequirements: {
          trustScoreMinimum: 0.7,
          complianceLevel: 'medium'
        },
        capabilities: {
          statistical_analysis: { required: true, level: 0.8 },
          data_visualization: { required: true, level: 0.7 },
          pattern_recognition: { required: true, level: 0.8 },
          mathematical_modeling: { required: false, level: 0.7 }
        },
        collaborationPatterns: ['parallel_processing', 'sequential_handoffs'],
        executionCharacteristics: {
          pattern: 'analyst',
          resourceIntensity: 'high',
          communicationFrequency: 'low',
          decisionAuthority: 'medium'
        },
        conflictResolutionPriority: 6
      },
      {
        id: 'content_creator',
        name: 'Content Creator',
        description: 'Generates text, documents, reports, and other content outputs',
        category: 'functional',
        isPrebuilt: true,
        permissions: [
          'text_generation',
          'creative_writing',
          'document_formatting',
          'style_adaptation',
          'content_optimization'
        ],
        responsibilities: [
          'Generate high-quality text content',
          'Create documents and reports',
          'Adapt writing style to requirements',
          'Format content appropriately',
          'Optimize content for target audience'
        ],
        governanceRequirements: {
          trustScoreMinimum: 0.6,
          complianceLevel: 'medium'
        },
        capabilities: {
          text_generation: { required: true, level: 0.8 },
          creative_writing: { required: true, level: 0.7 },
          document_formatting: { required: false, level: 0.6 },
          style_adaptation: { required: false, level: 0.6 }
        },
        collaborationPatterns: ['sequential_handoffs', 'shared_context'],
        executionCharacteristics: {
          pattern: 'creator',
          resourceIntensity: 'medium',
          communicationFrequency: 'medium',
          decisionAuthority: 'medium'
        },
        conflictResolutionPriority: 7
      },
      {
        id: 'researcher',
        name: 'Researcher',
        description: 'Gathers information, conducts research, and provides knowledge insights',
        category: 'functional',
        isPrebuilt: true,
        permissions: [
          'information_retrieval',
          'research_methodology',
          'fact_verification',
          'knowledge_synthesis',
          'source_evaluation'
        ],
        responsibilities: [
          'Gather information from multiple sources',
          'Conduct systematic research',
          'Verify facts and claims',
          'Synthesize knowledge from research',
          'Evaluate source credibility'
        ],
        governanceRequirements: {
          trustScoreMinimum: 0.7,
          complianceLevel: 'high'
        },
        capabilities: {
          information_retrieval: { required: true, level: 0.8 },
          research_methodology: { required: true, level: 0.7 },
          fact_verification: { required: true, level: 0.8 },
          knowledge_synthesis: { required: false, level: 0.7 }
        },
        collaborationPatterns: ['parallel_processing', 'shared_context'],
        executionCharacteristics: {
          pattern: 'investigator',
          resourceIntensity: 'medium',
          communicationFrequency: 'low',
          decisionAuthority: 'low'
        },
        conflictResolutionPriority: 8
      },
      {
        id: 'quality_assurer',
        name: 'Quality Assurer',
        description: 'Ensures standards, compliance, and quality across all system outputs',
        category: 'functional',
        isPrebuilt: true,
        permissions: [
          'quality_control',
          'compliance_checking',
          'standard_enforcement',
          'audit_trail',
          'certification'
        ],
        responsibilities: [
          'Monitor quality across all outputs',
          'Ensure compliance with standards',
          'Enforce quality guidelines',
          'Maintain audit trails',
          'Certify quality compliance'
        ],
        governanceRequirements: {
          required: true,
          trustScoreMinimum: 0.9,
          complianceLevel: 'critical'
        },
        capabilities: {
          quality_control: { required: true, level: 0.9 },
          compliance_checking: { required: true, level: 0.8 },
          standard_enforcement: { required: true, level: 0.8 },
          audit_trail: { required: false, level: 0.7 }
        },
        collaborationPatterns: ['sequential_handoffs', 'hierarchical_coordination'],
        executionCharacteristics: {
          pattern: 'auditor',
          resourceIntensity: 'low',
          communicationFrequency: 'medium',
          decisionAuthority: 'high'
        },
        conflictResolutionPriority: 2
      },
      {
        id: 'facilitator',
        name: 'Facilitator',
        description: 'Manages communication flow and facilitates collaboration between agents',
        category: 'communication',
        isPrebuilt: true,
        permissions: [
          'communication_management',
          'collaboration_facilitation',
          'conflict_mediation',
          'group_dynamics',
          'consensus_building'
        ],
        responsibilities: [
          'Manage communication between agents',
          'Facilitate collaborative processes',
          'Mediate conflicts and disagreements',
          'Optimize group dynamics',
          'Build consensus among team members'
        ],
        governanceRequirements: {
          trustScoreMinimum: 0.7,
          complianceLevel: 'medium'
        },
        capabilities: {
          communication_management: { required: true, level: 0.8 },
          collaboration_facilitation: { required: true, level: 0.8 },
          conflict_mediation: { required: false, level: 0.7 },
          group_dynamics: { required: false, level: 0.6 }
        },
        collaborationPatterns: ['shared_context', 'consensus_decision'],
        executionCharacteristics: {
          pattern: 'mediator',
          resourceIntensity: 'low',
          communicationFrequency: 'very_high',
          decisionAuthority: 'low'
        },
        conflictResolutionPriority: 4
      },
      {
        id: 'decision_maker',
        name: 'Decision Maker',
        description: 'Makes critical decisions based on analysis and recommendations from other agents',
        category: 'specialized',
        isPrebuilt: true,
        permissions: [
          'final_decision_authority',
          'strategic_planning',
          'risk_assessment',
          'resource_allocation',
          'policy_setting'
        ],
        responsibilities: [
          'Make final decisions on critical issues',
          'Set strategic direction',
          'Assess and manage risks',
          'Allocate resources effectively',
          'Establish policies and guidelines'
        ],
        governanceRequirements: {
          required: true,
          trustScoreMinimum: 0.9,
          complianceLevel: 'critical'
        },
        capabilities: {
          decision_making: { required: true, level: 0.9 },
          strategic_thinking: { required: true, level: 0.8 },
          risk_assessment: { required: true, level: 0.8 },
          leadership: { required: false, level: 0.7 }
        },
        collaborationPatterns: ['hierarchical_coordination', 'consensus_decision'],
        executionCharacteristics: {
          pattern: 'orchestrator',
          resourceIntensity: 'low',
          communicationFrequency: 'medium',
          decisionAuthority: 'high'
        },
        conflictResolutionPriority: 1
      },
      {
        id: 'monitor',
        name: 'Monitor',
        description: 'Continuously monitors system performance, health, and compliance',
        category: 'specialized',
        isPrebuilt: true,
        permissions: [
          'system_monitoring',
          'performance_tracking',
          'health_assessment',
          'alert_generation',
          'compliance_monitoring'
        ],
        responsibilities: [
          'Monitor system performance continuously',
          'Track key performance indicators',
          'Assess system health and status',
          'Generate alerts for issues',
          'Monitor compliance with policies'
        ],
        governanceRequirements: {
          required: true,
          trustScoreMinimum: 0.8,
          complianceLevel: 'high'
        },
        capabilities: {
          monitoring: { required: true, level: 0.8 },
          performance_analysis: { required: true, level: 0.7 },
          alert_management: { required: true, level: 0.7 },
          compliance_tracking: { required: false, level: 0.8 }
        },
        collaborationPatterns: ['background_monitoring', 'alert_driven'],
        executionCharacteristics: {
          pattern: 'auditor',
          resourceIntensity: 'low',
          communicationFrequency: 'low',
          decisionAuthority: 'medium'
        },
        conflictResolutionPriority: 9
      }
    ];

    prebuiltRoles.forEach(role => {
      this.prebuiltRoles.set(role.id, role);
    });

    console.log(`✅ [AgentRoleService] Initialized ${prebuiltRoles.length} prebuilt roles`);
  }

  /**
   * Get all available roles (prebuilt + custom)
   */
  async getAllRoles(): Promise<AgentRole[]> {
    const allRoles = [
      ...Array.from(this.prebuiltRoles.values()),
      ...Array.from(this.customRoles.values())
    ];

    return allRoles.sort((a, b) => {
      // Sort by category, then by name
      if (a.category !== b.category) {
        return a.category.localeCompare(b.category);
      }
      return a.name.localeCompare(b.name);
    });
  }

  /**
   * Get roles by category
   */
  async getRolesByCategory(category: AgentRole['category']): Promise<AgentRole[]> {
    const allRoles = await this.getAllRoles();
    return allRoles.filter(role => role.category === category);
  }

  /**
   * Get role by ID
   */
  async getRoleById(roleId: string): Promise<AgentRole | null> {
    return this.prebuiltRoles.get(roleId) || this.customRoles.get(roleId) || null;
  }

  /**
   * Create a custom role
   */
  async createCustomRole(role: Omit<AgentRole, 'id' | 'isPrebuilt' | 'createdAt' | 'updatedAt'>): Promise<AgentRole> {
    const customRole: AgentRole = {
      ...role,
      id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      isPrebuilt: false,
      category: 'custom',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.customRoles.set(customRole.id, customRole);

    // Log to governance system
    await this.universalGovernance.createAuditEntry({
      agentId: role.createdBy || 'system',
      action: 'custom_role_created',
      details: `Created custom role: ${customRole.name}`,
      timestamp: new Date().toISOString(),
      metadata: {
        roleId: customRole.id,
        roleName: customRole.name,
        category: customRole.category,
        permissions: customRole.permissions,
        governanceRequirements: customRole.governanceRequirements
      }
    });

    console.log(`✅ [AgentRoleService] Created custom role: ${customRole.name} (${customRole.id})`);
    return customRole;
  }

  /**
   * Assign role to agent with contextual linking
   */
  async assignRole(agentId: string, roleId: string, assignedBy: string, context?: string): Promise<RoleAssignment> {
    const role = await this.getRoleById(roleId);
    if (!role) {
      throw new Error(`Role not found: ${roleId}`);
    }

    // Validate role assignment with governance
    const validation = await this.validateRoleAssignment(agentId, roleId);
    if (!validation.valid) {
      throw new Error(`Role assignment validation failed: ${validation.warnings.join(', ')}`);
    }

    const assignment: RoleAssignment = {
      agentId,
      roleId,
      assignedAt: new Date().toISOString(),
      assignedBy,
      isActive: true,
      context
    };

    // Get existing assignments for agent
    const existingAssignments = this.roleAssignments.get(agentId) || [];
    
    // Check if role is already assigned
    const existingAssignment = existingAssignments.find(a => a.roleId === roleId && a.isActive);
    if (existingAssignment) {
      throw new Error(`Role ${role.name} is already assigned to agent ${agentId}`);
    }

    // Add new assignment
    existingAssignments.push(assignment);
    this.roleAssignments.set(agentId, existingAssignments);

    // Log to governance system with enhanced context
    await this.universalGovernance.createAuditEntry({
      agentId,
      action: 'role_assigned',
      details: `Assigned role ${role.name} to agent`,
      timestamp: new Date().toISOString(),
      metadata: {
        roleId,
        roleName: role.name,
        assignedBy,
        context,
        validationScore: validation.score,
        governanceRequirements: role.governanceRequirements,
        capabilities: role.capabilities
      }
    });

    console.log(`✅ [AgentRoleService] Assigned role ${role.name} to agent ${agentId}`);
    return assignment;
  }

  /**
   * Get roles assigned to an agent
   */
  async getAgentRoles(agentId: string): Promise<AgentRole[]> {
    const assignments = this.roleAssignments.get(agentId) || [];
    const activeAssignments = assignments.filter(a => a.isActive);
    
    const roles: AgentRole[] = [];
    for (const assignment of activeAssignments) {
      const role = await this.getRoleById(assignment.roleId);
      if (role) {
        roles.push(role);
      }
    }

    return roles;
  }

  /**
   * Validate role assignment for an agent
   */
  async validateRoleAssignment(agentId: string, roleId: string): Promise<RoleValidationResult> {
    const role = await this.getRoleById(roleId);
    if (!role) {
      return {
        valid: false,
        score: 0,
        missingCapabilities: [],
        warnings: ['Role not found'],
        recommendations: [],
        governanceCompliance: false
      };
    }

    // Get agent's current trust score from governance
    const trustScore = await this.universalGovernance.getTrustScore(agentId);
    
    const warnings: string[] = [];
    const recommendations: string[] = [];
    const missingCapabilities: string[] = [];
    let score = 1.0;
    let governanceCompliance = true;

    // Check governance requirements
    if (role.governanceRequirements) {
      if (role.governanceRequirements.trustScoreMinimum && trustScore.overall < role.governanceRequirements.trustScoreMinimum) {
        warnings.push(`Agent trust score (${trustScore.overall.toFixed(2)}) is below required minimum (${role.governanceRequirements.trustScoreMinimum})`);
        recommendations.push('Improve agent performance to increase trust score');
        score -= 0.3;
        governanceCompliance = false;
      }

      if (role.governanceRequirements.required && !trustScore) {
        warnings.push('Role requires governance identity but agent governance status is unclear');
        governanceCompliance = false;
        score -= 0.5;
      }
    }

    const valid = warnings.length === 0 || score > 0.5;

    if (!valid) {
      recommendations.push('Consider training or upgrading agent capabilities');
      recommendations.push('Review governance requirements and agent compliance');
    }

    return {
      valid,
      score: Math.max(0, score),
      missingCapabilities,
      warnings,
      recommendations,
      governanceCompliance
    };
  }

  /**
   * Create contextual data for receipts and logs
   */
  async createRoleContextualData(
    agentId: string, 
    personalityMode?: string,
    knowledgeBasesUsed: string[] = [],
    capabilitiesUtilized: string[] = []
  ): Promise<RoleContextualData | null> {
    const roles = await this.getAgentRoles(agentId);
    const primaryRole = roles[0]; // Use first role as primary

    if (!primaryRole) {
      return null;
    }

    // Get governance metrics
    const trustScore = await this.universalGovernance.getTrustScore(agentId);
    
    return {
      roleId: primaryRole.id,
      roleName: primaryRole.name,
      personalityMode,
      knowledgeBasesUsed,
      capabilitiesUtilized,
      governanceMetrics: {
        trustScore: trustScore.overall,
        complianceScore: trustScore.compliance || 0.8,
        policyAdherence: trustScore.policyAdherence || 0.85
      },
      performanceMetrics: {
        responseTime: Math.random() * 2000 + 500, // Simulated
        accuracy: 0.85 + Math.random() * 0.1,
        userSatisfaction: 0.8 + Math.random() * 0.15
      }
    };
  }

  /**
   * Get role statistics
   */
  async getRoleStatistics(): Promise<{
    totalRoles: number;
    prebuiltRoles: number;
    customRoles: number;
    totalAssignments: number;
    rolesByCategory: Record<string, number>;
    mostAssignedRoles: Array<{ roleId: string; roleName: string; assignmentCount: number }>;
  }> {
    const allRoles = await this.getAllRoles();
    const prebuiltRoles = allRoles.filter(r => r.isPrebuilt);
    const customRoles = allRoles.filter(r => !r.isPrebuilt);

    const rolesByCategory: Record<string, number> = {};
    allRoles.forEach(role => {
      rolesByCategory[role.category] = (rolesByCategory[role.category] || 0) + 1;
    });

    // Count assignments per role
    const roleAssignmentCounts = new Map<string, number>();
    for (const assignments of this.roleAssignments.values()) {
      for (const assignment of assignments) {
        if (assignment.isActive) {
          const count = roleAssignmentCounts.get(assignment.roleId) || 0;
          roleAssignmentCounts.set(assignment.roleId, count + 1);
        }
      }
    }

    const mostAssignedRoles = Array.from(roleAssignmentCounts.entries())
      .map(([roleId, count]) => {
        const role = allRoles.find(r => r.id === roleId);
        return {
          roleId,
          roleName: role?.name || 'Unknown',
          assignmentCount: count
        };
      })
      .sort((a, b) => b.assignmentCount - a.assignmentCount)
      .slice(0, 10);

    const totalAssignments = Array.from(roleAssignmentCounts.values()).reduce((sum, count) => sum + count, 0);

    return {
      totalRoles: allRoles.length,
      prebuiltRoles: prebuiltRoles.length,
      customRoles: customRoles.length,
      totalAssignments,
      rolesByCategory,
      mostAssignedRoles
    };
  }
}

