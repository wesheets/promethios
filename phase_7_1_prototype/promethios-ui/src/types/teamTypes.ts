/**
 * Agent Team Data Models and Interfaces
 * 
 * Defines the structure for multi-agent teams, roles, and workflows
 */

export interface AgentRole {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  permissions: {
    canInitiateWorkflow: boolean;
    canModifyGovernance: boolean;
    canAccessSensitiveData: boolean;
    canOverrideDecisions: boolean;
  };
  governanceLevel: 'basic' | 'standard' | 'strict' | 'maximum';
  trustRequirement: number; // Minimum trust score required
}

export interface AgentTeamMember {
  agentId: string;
  roleId: string;
  joinedAt: string;
  status: 'active' | 'inactive' | 'suspended';
  performanceMetrics: {
    averageTrustScore: number;
    totalInteractions: number;
    violationCount: number;
    lastActivity: string;
  };
  specializations?: string[];
}

export interface AgentTeam {
  id: string;
  name: string;
  description: string;
  ownerId: string; // User who created the team
  createdAt: string;
  updatedAt: string;
  status: 'active' | 'inactive' | 'archived';
  
  // Team configuration
  teamType: 'collaborative' | 'hierarchical' | 'specialized' | 'custom';
  maxMembers: number;
  governancePolicy: {
    inheritFromMembers: boolean;
    overrideLevel?: 'basic' | 'standard' | 'strict' | 'maximum';
    requireConsensus: boolean;
    escalationRules: {
      trustThreshold: number;
      violationLimit: number;
      timeoutMinutes: number;
    };
  };
  
  // Team members and roles
  members: AgentTeamMember[];
  roles: AgentRole[];
  
  // Workflow configuration
  workflows: AgentWorkflow[];
  
  // Team metrics
  metrics: {
    averageTeamTrustScore: number;
    totalTeamInteractions: number;
    teamViolationRate: number;
    collaborationEfficiency: number;
    governanceCompliance: number;
  };
}

export interface AgentWorkflow {
  id: string;
  name: string;
  description: string;
  teamId: string;
  createdAt: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  
  // Workflow steps
  steps: WorkflowStep[];
  
  // Execution settings
  execution: {
    triggerType: 'manual' | 'scheduled' | 'event' | 'api';
    triggerConfig?: {
      schedule?: string; // Cron expression
      events?: string[]; // Event types to listen for
      apiEndpoint?: string; // Webhook URL
    };
    timeoutMinutes: number;
    retryPolicy: {
      maxRetries: number;
      backoffStrategy: 'linear' | 'exponential';
    };
  };
  
  // Governance settings
  governance: {
    requireApproval: boolean;
    approverRoles: string[];
    governanceLevel: 'basic' | 'standard' | 'strict' | 'maximum';
    auditTrail: boolean;
  };
}

export interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  stepType: 'agent_task' | 'human_approval' | 'condition' | 'parallel' | 'loop';
  order: number;
  
  // Step configuration
  config: {
    assignedAgentId?: string;
    assignedRoleId?: string;
    prompt?: string;
    expectedOutput?: string;
    timeoutMinutes?: number;
    
    // Conditional logic
    condition?: {
      field: string;
      operator: 'equals' | 'contains' | 'greater_than' | 'less_than';
      value: any;
    };
    
    // Parallel execution
    parallelSteps?: string[]; // Step IDs to execute in parallel
    
    // Loop configuration
    loopConfig?: {
      maxIterations: number;
      breakCondition: {
        field: string;
        operator: string;
        value: any;
      };
    };
  };
  
  // Dependencies
  dependencies: string[]; // Step IDs that must complete before this step
  
  // Governance
  governance: {
    requiresReview: boolean;
    reviewerRoles: string[];
    trustThreshold: number;
  };
}

export interface TeamInvitation {
  id: string;
  teamId: string;
  agentId: string;
  roleId: string;
  invitedBy: string;
  invitedAt: string;
  expiresAt: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  message?: string;
}

export interface TeamActivity {
  id: string;
  teamId: string;
  activityType: 'member_joined' | 'member_left' | 'workflow_started' | 'workflow_completed' | 'governance_violation' | 'role_changed';
  actorId: string; // Agent or user ID
  targetId?: string; // Target agent or workflow ID
  timestamp: string;
  details: {
    description: string;
    metadata?: Record<string, any>;
  };
  severity: 'info' | 'warning' | 'error';
}

/**
 * Team Configuration Templates
 */
export const TEAM_TEMPLATES = {
  collaborative: {
    name: 'Collaborative Team',
    description: 'Agents work together on shared tasks with equal authority',
    defaultRoles: [
      {
        name: 'Team Member',
        description: 'Standard team member with collaborative permissions',
        capabilities: ['chat', 'analyze', 'research', 'create'],
        permissions: {
          canInitiateWorkflow: true,
          canModifyGovernance: false,
          canAccessSensitiveData: false,
          canOverrideDecisions: false
        },
        governanceLevel: 'standard' as const,
        trustRequirement: 75
      }
    ],
    governancePolicy: {
      inheritFromMembers: true,
      requireConsensus: true,
      escalationRules: {
        trustThreshold: 70,
        violationLimit: 3,
        timeoutMinutes: 30
      }
    }
  },
  
  hierarchical: {
    name: 'Hierarchical Team',
    description: 'Agents with defined hierarchy and escalation paths',
    defaultRoles: [
      {
        name: 'Team Lead',
        description: 'Senior agent with oversight and approval authority',
        capabilities: ['chat', 'analyze', 'research', 'create', 'approve', 'escalate'],
        permissions: {
          canInitiateWorkflow: true,
          canModifyGovernance: true,
          canAccessSensitiveData: true,
          canOverrideDecisions: true
        },
        governanceLevel: 'strict' as const,
        trustRequirement: 90
      },
      {
        name: 'Team Member',
        description: 'Standard team member reporting to team lead',
        capabilities: ['chat', 'analyze', 'research', 'create'],
        permissions: {
          canInitiateWorkflow: false,
          canModifyGovernance: false,
          canAccessSensitiveData: false,
          canOverrideDecisions: false
        },
        governanceLevel: 'standard' as const,
        trustRequirement: 75
      }
    ],
    governancePolicy: {
      inheritFromMembers: false,
      overrideLevel: 'strict',
      requireConsensus: false,
      escalationRules: {
        trustThreshold: 80,
        violationLimit: 2,
        timeoutMinutes: 15
      }
    }
  },
  
  specialized: {
    name: 'Specialized Team',
    description: 'Agents with specific roles and expertise areas',
    defaultRoles: [
      {
        name: 'Research Specialist',
        description: 'Agent specialized in research and data analysis',
        capabilities: ['research', 'analyze', 'fact_check'],
        permissions: {
          canInitiateWorkflow: true,
          canModifyGovernance: false,
          canAccessSensitiveData: true,
          canOverrideDecisions: false
        },
        governanceLevel: 'strict' as const,
        trustRequirement: 85
      },
      {
        name: 'Content Creator',
        description: 'Agent specialized in content creation and writing',
        capabilities: ['create', 'edit', 'format'],
        permissions: {
          canInitiateWorkflow: true,
          canModifyGovernance: false,
          canAccessSensitiveData: false,
          canOverrideDecisions: false
        },
        governanceLevel: 'standard' as const,
        trustRequirement: 80
      },
      {
        name: 'Quality Reviewer',
        description: 'Agent specialized in quality assurance and review',
        capabilities: ['review', 'approve', 'quality_check'],
        permissions: {
          canInitiateWorkflow: false,
          canModifyGovernance: false,
          canAccessSensitiveData: true,
          canOverrideDecisions: true
        },
        governanceLevel: 'maximum' as const,
        trustRequirement: 95
      }
    ],
    governancePolicy: {
      inheritFromMembers: false,
      overrideLevel: 'strict',
      requireConsensus: true,
      escalationRules: {
        trustThreshold: 85,
        violationLimit: 1,
        timeoutMinutes: 10
      }
    }
  }
} as const;

/**
 * Team Metrics Calculation Utilities
 */
export class TeamMetricsCalculator {
  static calculateTeamTrustScore(members: AgentTeamMember[]): number {
    if (members.length === 0) return 0;
    
    const totalTrust = members.reduce((sum, member) => 
      sum + member.performanceMetrics.averageTrustScore, 0
    );
    
    return Math.round(totalTrust / members.length);
  }
  
  static calculateCollaborationEfficiency(team: AgentTeam): number {
    // Calculate based on workflow completion rates, response times, and coordination
    const workflows = team.workflows.filter(w => w.status === 'completed');
    const totalWorkflows = team.workflows.length;
    
    if (totalWorkflows === 0) return 0;
    
    const completionRate = workflows.length / totalWorkflows;
    const avgTrustScore = team.metrics.averageTeamTrustScore / 100;
    const violationPenalty = Math.max(0, 1 - (team.metrics.teamViolationRate / 10));
    
    return Math.round(completionRate * avgTrustScore * violationPenalty * 100);
  }
  
  static calculateGovernanceCompliance(team: AgentTeam): number {
    const totalInteractions = team.metrics.totalTeamInteractions;
    const violationRate = team.metrics.teamViolationRate;
    
    if (totalInteractions === 0) return 100;
    
    const complianceRate = Math.max(0, 1 - (violationRate / 100));
    return Math.round(complianceRate * 100);
  }
}

