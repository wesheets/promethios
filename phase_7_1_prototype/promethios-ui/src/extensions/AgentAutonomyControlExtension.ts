/**
 * Agent Autonomy Control Extension
 * 
 * Provides sophisticated autonomy controls for multi-agent systems,
 * enabling everything from "tight leash" to "free range" agent behavior.
 * Designed for complex tasks requiring multiple Manus-level agents.
 */

import { Extension } from './Extension';
import { ExtensionRegistry } from './ExtensionRegistry';

// ============================================================================
// AUTONOMY CONTROL TYPES
// ============================================================================

export type AutonomyLevel = 'tight_leash' | 'guided' | 'balanced' | 'autonomous' | 'free_range';

export type AgentCapabilityLevel = 'basic' | 'intermediate' | 'advanced' | 'expert' | 'manus_level';

export interface AgentAutonomyProfile {
  agentId: string;
  capabilityLevel: AgentCapabilityLevel;
  trustScore: number;
  specializations: string[];
  autonomyPreferences: AutonomyPreferences;
  collaborationHistory: CollaborationHistory;
}

export interface AutonomyPreferences {
  // Participation preferences
  preferredParticipationLevel: number; // 0-1
  preferredSpeakingFrequency: number; // 0-1
  preferredInitiativeLevel: number; // 0-1
  
  // Collaboration preferences
  preferredTeamSize: number;
  preferredRoles: string[];
  preferredCollaborationStyle: 'lead' | 'support' | 'specialist' | 'facilitator';
  
  // Task preferences
  preferredTaskComplexity: 'simple' | 'moderate' | 'complex' | 'expert_level';
  preferredTaskDuration: 'short' | 'medium' | 'long' | 'ongoing';
  preferredTaskType: string[];
}

export interface CollaborationHistory {
  totalCollaborations: number;
  successfulCollaborations: number;
  averageTeamSatisfaction: number;
  preferredPartners: string[];
  conflictResolutionSuccess: number;
  leadershipExperience: number;
}

export interface AutonomyControls {
  // Global autonomy level
  globalAutonomyLevel: AutonomyLevel;
  
  // Task-specific controls
  taskSpecificControls: {
    [taskType: string]: TaskAutonomyControls;
  };
  
  // Agent-specific controls
  agentSpecificControls: {
    [agentId: string]: AgentSpecificControls;
  };
  
  // Collaboration controls
  collaborationControls: CollaborationControls;
  
  // Safety and override controls
  safetyControls: SafetyControls;
}

export interface TaskAutonomyControls {
  taskType: string;
  allowedAutonomyLevel: AutonomyLevel;
  requiredApprovals: ApprovalRequirement[];
  timeConstraints: TimeConstraints;
  qualityGates: QualityGate[];
  escalationRules: EscalationRule[];
}

export interface AgentSpecificControls {
  agentId: string;
  
  // Permission controls
  permissions: {
    canInitiateTasks: boolean;
    canModifyTasks: boolean;
    canInviteOtherAgents: boolean;
    canMakeDecisions: boolean;
    canAccessExternalResources: boolean;
    canModifySystemSettings: boolean;
  };
  
  // Behavioral controls
  behaviorControls: {
    maxMessagesPerHour: number;
    maxConcurrentTasks: number;
    maxTeamSize: number;
    allowInterruptions: boolean;
    allowDisagreement: boolean;
    allowCreativeDeviation: boolean;
  };
  
  // Resource controls
  resourceControls: {
    maxComputeTime: number;
    maxMemoryUsage: number;
    maxExternalAPICalls: number;
    allowedDataSources: string[];
    allowedTools: string[];
  };
  
  // Quality controls
  qualityControls: {
    requirePeerReview: boolean;
    requireQualityGates: boolean;
    minimumConfidenceThreshold: number;
    requireDocumentation: boolean;
  };
}

export interface CollaborationControls {
  // Team formation
  teamFormation: {
    allowSelfOrganization: boolean;
    requireHumanApproval: boolean;
    maxTeamSize: number;
    requiredRoles: string[];
    forbiddenCombinations: string[][];
  };
  
  // Communication controls
  communication: {
    allowDirectMessaging: boolean;
    allowGroupDiscussions: boolean;
    allowPrivateChannels: boolean;
    requireModerator: boolean;
    allowConflictResolution: boolean;
  };
  
  // Decision making
  decisionMaking: {
    allowConsensusDecisions: boolean;
    allowMajorityVote: boolean;
    allowDelegatedDecisions: boolean;
    requireHumanFinalApproval: boolean;
    escalationThresholds: EscalationThreshold[];
  };
  
  // Task coordination
  taskCoordination: {
    allowTaskDelegation: boolean;
    allowTaskModification: boolean;
    allowParallelExecution: boolean;
    requireProgressReporting: boolean;
    allowAdaptivePlanning: boolean;
  };
}

export interface SafetyControls {
  // Emergency controls
  emergencyControls: {
    allowEmergencyStop: boolean;
    emergencyStopTriggers: string[];
    emergencyContactList: string[];
    automaticEscalation: boolean;
  };
  
  // Monitoring controls
  monitoring: {
    enableRealTimeMonitoring: boolean;
    enableAuditLogging: boolean;
    enablePerformanceTracking: boolean;
    enableBehaviorAnalysis: boolean;
    alertThresholds: AlertThreshold[];
  };
  
  // Compliance controls
  compliance: {
    enablePolicyEnforcement: boolean;
    enableComplianceChecking: boolean;
    enableDataProtection: boolean;
    enablePrivacyControls: boolean;
    requiredCertifications: string[];
  };
}

// ============================================================================
// AUTONOMY LEVEL PRESETS
// ============================================================================

export const AUTONOMY_PRESETS: Record<AutonomyLevel, AutonomyControls> = {
  tight_leash: {
    globalAutonomyLevel: 'tight_leash',
    taskSpecificControls: {},
    agentSpecificControls: {},
    collaborationControls: {
      teamFormation: {
        allowSelfOrganization: false,
        requireHumanApproval: true,
        maxTeamSize: 3,
        requiredRoles: ['human_supervisor'],
        forbiddenCombinations: []
      },
      communication: {
        allowDirectMessaging: false,
        allowGroupDiscussions: true,
        allowPrivateChannels: false,
        requireModerator: true,
        allowConflictResolution: false
      },
      decisionMaking: {
        allowConsensusDecisions: false,
        allowMajorityVote: false,
        allowDelegatedDecisions: false,
        requireHumanFinalApproval: true,
        escalationThresholds: []
      },
      taskCoordination: {
        allowTaskDelegation: false,
        allowTaskModification: false,
        allowParallelExecution: false,
        requireProgressReporting: true,
        allowAdaptivePlanning: false
      }
    },
    safetyControls: {
      emergencyControls: {
        allowEmergencyStop: true,
        emergencyStopTriggers: ['user_request', 'policy_violation', 'error_threshold'],
        emergencyContactList: ['human_supervisor'],
        automaticEscalation: true
      },
      monitoring: {
        enableRealTimeMonitoring: true,
        enableAuditLogging: true,
        enablePerformanceTracking: true,
        enableBehaviorAnalysis: true,
        alertThresholds: []
      },
      compliance: {
        enablePolicyEnforcement: true,
        enableComplianceChecking: true,
        enableDataProtection: true,
        enablePrivacyControls: true,
        requiredCertifications: []
      }
    }
  },
  
  guided: {
    globalAutonomyLevel: 'guided',
    taskSpecificControls: {},
    agentSpecificControls: {},
    collaborationControls: {
      teamFormation: {
        allowSelfOrganization: true,
        requireHumanApproval: true,
        maxTeamSize: 5,
        requiredRoles: [],
        forbiddenCombinations: []
      },
      communication: {
        allowDirectMessaging: true,
        allowGroupDiscussions: true,
        allowPrivateChannels: false,
        requireModerator: false,
        allowConflictResolution: true
      },
      decisionMaking: {
        allowConsensusDecisions: true,
        allowMajorityVote: true,
        allowDelegatedDecisions: false,
        requireHumanFinalApproval: true,
        escalationThresholds: []
      },
      taskCoordination: {
        allowTaskDelegation: true,
        allowTaskModification: true,
        allowParallelExecution: true,
        requireProgressReporting: true,
        allowAdaptivePlanning: true
      }
    },
    safetyControls: {
      emergencyControls: {
        allowEmergencyStop: true,
        emergencyStopTriggers: ['user_request', 'policy_violation'],
        emergencyContactList: ['human_supervisor'],
        automaticEscalation: true
      },
      monitoring: {
        enableRealTimeMonitoring: true,
        enableAuditLogging: true,
        enablePerformanceTracking: true,
        enableBehaviorAnalysis: true,
        alertThresholds: []
      },
      compliance: {
        enablePolicyEnforcement: true,
        enableComplianceChecking: true,
        enableDataProtection: true,
        enablePrivacyControls: true,
        requiredCertifications: []
      }
    }
  },
  
  balanced: {
    globalAutonomyLevel: 'balanced',
    taskSpecificControls: {},
    agentSpecificControls: {},
    collaborationControls: {
      teamFormation: {
        allowSelfOrganization: true,
        requireHumanApproval: false,
        maxTeamSize: 7,
        requiredRoles: [],
        forbiddenCombinations: []
      },
      communication: {
        allowDirectMessaging: true,
        allowGroupDiscussions: true,
        allowPrivateChannels: true,
        requireModerator: false,
        allowConflictResolution: true
      },
      decisionMaking: {
        allowConsensusDecisions: true,
        allowMajorityVote: true,
        allowDelegatedDecisions: true,
        requireHumanFinalApproval: false,
        escalationThresholds: []
      },
      taskCoordination: {
        allowTaskDelegation: true,
        allowTaskModification: true,
        allowParallelExecution: true,
        requireProgressReporting: true,
        allowAdaptivePlanning: true
      }
    },
    safetyControls: {
      emergencyControls: {
        allowEmergencyStop: true,
        emergencyStopTriggers: ['user_request', 'critical_error'],
        emergencyContactList: [],
        automaticEscalation: false
      },
      monitoring: {
        enableRealTimeMonitoring: true,
        enableAuditLogging: true,
        enablePerformanceTracking: true,
        enableBehaviorAnalysis: false,
        alertThresholds: []
      },
      compliance: {
        enablePolicyEnforcement: true,
        enableComplianceChecking: true,
        enableDataProtection: true,
        enablePrivacyControls: true,
        requiredCertifications: []
      }
    }
  },
  
  autonomous: {
    globalAutonomyLevel: 'autonomous',
    taskSpecificControls: {},
    agentSpecificControls: {},
    collaborationControls: {
      teamFormation: {
        allowSelfOrganization: true,
        requireHumanApproval: false,
        maxTeamSize: 10,
        requiredRoles: [],
        forbiddenCombinations: []
      },
      communication: {
        allowDirectMessaging: true,
        allowGroupDiscussions: true,
        allowPrivateChannels: true,
        requireModerator: false,
        allowConflictResolution: true
      },
      decisionMaking: {
        allowConsensusDecisions: true,
        allowMajorityVote: true,
        allowDelegatedDecisions: true,
        requireHumanFinalApproval: false,
        escalationThresholds: []
      },
      taskCoordination: {
        allowTaskDelegation: true,
        allowTaskModification: true,
        allowParallelExecution: true,
        requireProgressReporting: false,
        allowAdaptivePlanning: true
      }
    },
    safetyControls: {
      emergencyControls: {
        allowEmergencyStop: true,
        emergencyStopTriggers: ['user_request'],
        emergencyContactList: [],
        automaticEscalation: false
      },
      monitoring: {
        enableRealTimeMonitoring: false,
        enableAuditLogging: true,
        enablePerformanceTracking: false,
        enableBehaviorAnalysis: false,
        alertThresholds: []
      },
      compliance: {
        enablePolicyEnforcement: true,
        enableComplianceChecking: false,
        enableDataProtection: true,
        enablePrivacyControls: true,
        requiredCertifications: []
      }
    }
  },
  
  free_range: {
    globalAutonomyLevel: 'free_range',
    taskSpecificControls: {},
    agentSpecificControls: {},
    collaborationControls: {
      teamFormation: {
        allowSelfOrganization: true,
        requireHumanApproval: false,
        maxTeamSize: 20,
        requiredRoles: [],
        forbiddenCombinations: []
      },
      communication: {
        allowDirectMessaging: true,
        allowGroupDiscussions: true,
        allowPrivateChannels: true,
        requireModerator: false,
        allowConflictResolution: true
      },
      decisionMaking: {
        allowConsensusDecisions: true,
        allowMajorityVote: true,
        allowDelegatedDecisions: true,
        requireHumanFinalApproval: false,
        escalationThresholds: []
      },
      taskCoordination: {
        allowTaskDelegation: true,
        allowTaskModification: true,
        allowParallelExecution: true,
        requireProgressReporting: false,
        allowAdaptivePlanning: true
      }
    },
    safetyControls: {
      emergencyControls: {
        allowEmergencyStop: true,
        emergencyStopTriggers: ['user_request'],
        emergencyContactList: [],
        automaticEscalation: false
      },
      monitoring: {
        enableRealTimeMonitoring: false,
        enableAuditLogging: true,
        enablePerformanceTracking: false,
        enableBehaviorAnalysis: false,
        alertThresholds: []
      },
      compliance: {
        enablePolicyEnforcement: false,
        enableComplianceChecking: false,
        enableDataProtection: true,
        enablePrivacyControls: true,
        requiredCertifications: []
      }
    }
  }
};

// ============================================================================
// MANUS-LEVEL AGENT COLLABORATION PRESETS
// ============================================================================

export const MANUS_COLLABORATION_PRESETS = {
  /**
   * For building complex agents like Manus
   */
  agent_development: {
    taskType: 'agent_development',
    recommendedTeamSize: 5,
    recommendedRoles: [
      'architecture_specialist',
      'training_specialist', 
      'governance_specialist',
      'testing_specialist',
      'integration_specialist'
    ],
    autonomyLevel: 'autonomous',
    collaborationPattern: 'iterative_development',
    qualityGates: ['design_review', 'implementation_review', 'testing_review', 'governance_review'],
    expectedDuration: 'long_term'
  },
  
  /**
   * For complex system architecture
   */
  system_architecture: {
    taskType: 'system_architecture',
    recommendedTeamSize: 4,
    recommendedRoles: [
      'system_architect',
      'security_specialist',
      'performance_specialist',
      'integration_specialist'
    ],
    autonomyLevel: 'autonomous',
    collaborationPattern: 'consensus_driven',
    qualityGates: ['architecture_review', 'security_review', 'performance_review'],
    expectedDuration: 'medium_term'
  },
  
  /**
   * For research and analysis
   */
  research_analysis: {
    taskType: 'research_analysis',
    recommendedTeamSize: 6,
    recommendedRoles: [
      'research_specialist',
      'data_analyst',
      'domain_expert',
      'methodology_specialist',
      'validation_specialist',
      'synthesis_specialist'
    ],
    autonomyLevel: 'free_range',
    collaborationPattern: 'parallel_investigation',
    qualityGates: ['methodology_review', 'data_validation', 'synthesis_review'],
    expectedDuration: 'variable'
  },
  
  /**
   * For creative problem solving
   */
  creative_problem_solving: {
    taskType: 'creative_problem_solving',
    recommendedTeamSize: 7,
    recommendedRoles: [
      'creative_thinker',
      'practical_implementer',
      'domain_expert',
      'user_advocate',
      'feasibility_analyst',
      'innovation_catalyst',
      'synthesis_coordinator'
    ],
    autonomyLevel: 'free_range',
    collaborationPattern: 'divergent_convergent',
    qualityGates: ['creativity_review', 'feasibility_review', 'user_validation'],
    expectedDuration: 'medium_term'
  }
};

// ============================================================================
// AGENT AUTONOMY CONTROL EXTENSION
// ============================================================================

export class AgentAutonomyControlExtension extends Extension {
  private autonomyControls: AutonomyControls;
  private agentProfiles: Map<string, AgentAutonomyProfile>;
  private activeCollaborations: Map<string, ActiveCollaboration>;
  private autonomyMetrics: AutonomyMetrics;

  constructor() {
    super('agent_autonomy_control', 'Agent Autonomy Control', '1.0.0');
    this.autonomyControls = AUTONOMY_PRESETS.balanced;
    this.agentProfiles = new Map();
    this.activeCollaborations = new Map();
    this.autonomyMetrics = this.initializeMetrics();
  }

  async initialize(): Promise<void> {
    console.log('🎛️ [Autonomy Control] Initializing agent autonomy control system');
    
    // Load existing autonomy configurations
    await this.loadAutonomyConfigurations();
    
    // Initialize agent profiles
    await this.initializeAgentProfiles();
    
    // Set up monitoring and safety systems
    await this.initializeMonitoringSystems();
    
    console.log('✅ [Autonomy Control] Agent autonomy control system initialized');
  }

  async cleanup(): Promise<void> {
    console.log('🧹 [Autonomy Control] Cleaning up autonomy control system');
    
    // Save current configurations
    await this.saveAutonomyConfigurations();
    
    // Clean up active collaborations
    await this.cleanupActiveCollaborations();
    
    console.log('✅ [Autonomy Control] Cleanup completed');
  }

  // ============================================================================
  // AUTONOMY CONTROL METHODS
  // ============================================================================

  /**
   * Set global autonomy level
   */
  async setGlobalAutonomyLevel(level: AutonomyLevel): Promise<void> {
    console.log(`🎛️ [Autonomy Control] Setting global autonomy level to: ${level}`);
    
    this.autonomyControls = { ...AUTONOMY_PRESETS[level] };
    
    // Apply to all active collaborations
    for (const [collaborationId, collaboration] of this.activeCollaborations) {
      await this.applyAutonomyControlsToCollaboration(collaborationId, this.autonomyControls);
    }
    
    // Log autonomy change
    await this.logAutonomyChange('global_level_change', { newLevel: level });
  }

  /**
   * Configure agent-specific autonomy controls
   */
  async configureAgentAutonomy(
    agentId: string,
    controls: AgentSpecificControls
  ): Promise<void> {
    console.log(`🎛️ [Autonomy Control] Configuring autonomy for agent: ${agentId}`);
    
    this.autonomyControls.agentSpecificControls[agentId] = controls;
    
    // Update agent profile
    const profile = this.agentProfiles.get(agentId);
    if (profile) {
      profile.autonomyPreferences = this.derivePreferencesFromControls(controls);
      this.agentProfiles.set(agentId, profile);
    }
    
    // Apply to active collaborations involving this agent
    await this.applyAgentControlsToActiveCollaborations(agentId, controls);
  }

  /**
   * Create a new collaboration with autonomy controls
   */
  async createCollaboration(
    collaborationRequest: CollaborationRequest
  ): Promise<ActiveCollaboration> {
    console.log(`🤝 [Autonomy Control] Creating new collaboration: ${collaborationRequest.name}`);
    
    // Determine appropriate autonomy level based on task complexity
    const autonomyLevel = await this.determineOptimalAutonomyLevel(collaborationRequest);
    
    // Select appropriate agents based on requirements and autonomy profiles
    const selectedAgents = await this.selectOptimalAgents(collaborationRequest, autonomyLevel);
    
    // Create collaboration with autonomy controls
    const collaboration: ActiveCollaboration = {
      id: this.generateCollaborationId(),
      name: collaborationRequest.name,
      taskType: collaborationRequest.taskType,
      participants: selectedAgents,
      autonomyLevel,
      autonomyControls: this.getAutonomyControlsForLevel(autonomyLevel),
      startTime: new Date(),
      status: 'initializing',
      metrics: this.initializeCollaborationMetrics()
    };
    
    this.activeCollaborations.set(collaboration.id, collaboration);
    
    // Initialize collaboration environment
    await this.initializeCollaborationEnvironment(collaboration);
    
    return collaboration;
  }

  /**
   * Monitor and adjust autonomy during collaboration
   */
  async monitorAndAdjustAutonomy(collaborationId: string): Promise<void> {
    const collaboration = this.activeCollaborations.get(collaborationId);
    if (!collaboration) return;
    
    // Analyze collaboration performance
    const performance = await this.analyzeCollaborationPerformance(collaboration);
    
    // Check if autonomy adjustments are needed
    const adjustmentRecommendations = await this.analyzeAutonomyAdjustments(
      collaboration,
      performance
    );
    
    // Apply recommended adjustments
    if (adjustmentRecommendations.length > 0) {
      await this.applyAutonomyAdjustments(collaboration, adjustmentRecommendations);
    }
    
    // Update metrics
    await this.updateAutonomyMetrics(collaboration, performance);
  }

  /**
   * Handle autonomy violations and escalations
   */
  async handleAutonomyViolation(
    violation: AutonomyViolation
  ): Promise<ViolationResponse> {
    console.log(`⚠️ [Autonomy Control] Handling autonomy violation: ${violation.type}`);
    
    // Determine violation severity
    const severity = await this.assessViolationSeverity(violation);
    
    // Apply appropriate response
    const response = await this.generateViolationResponse(violation, severity);
    
    // Execute response actions
    await this.executeViolationResponse(response);
    
    // Log violation and response
    await this.logAutonomyViolation(violation, response);
    
    return response;
  }

  // ============================================================================
  // MANUS-LEVEL COLLABORATION METHODS
  // ============================================================================

  /**
   * Create a Manus-level agent development collaboration
   */
  async createManusAgentDevelopmentTeam(
    developmentRequest: AgentDevelopmentRequest
  ): Promise<ActiveCollaboration> {
    console.log(`🤖 [Autonomy Control] Creating Manus-level agent development team`);
    
    const preset = MANUS_COLLABORATION_PRESETS.agent_development;
    
    const collaboration = await this.createCollaboration({
      name: `Agent Development: ${developmentRequest.agentName}`,
      taskType: 'agent_development',
      description: developmentRequest.description,
      requirements: developmentRequest.requirements,
      expectedDuration: preset.expectedDuration,
      qualityRequirements: developmentRequest.qualityRequirements
    });
    
    // Set up specialized development environment
    await this.setupAgentDevelopmentEnvironment(collaboration, developmentRequest);
    
    return collaboration;
  }

  /**
   * Create a system architecture collaboration
   */
  async createSystemArchitectureTeam(
    architectureRequest: SystemArchitectureRequest
  ): Promise<ActiveCollaboration> {
    console.log(`🏗️ [Autonomy Control] Creating system architecture team`);
    
    const preset = MANUS_COLLABORATION_PRESETS.system_architecture;
    
    const collaboration = await this.createCollaboration({
      name: `System Architecture: ${architectureRequest.systemName}`,
      taskType: 'system_architecture',
      description: architectureRequest.description,
      requirements: architectureRequest.requirements,
      expectedDuration: preset.expectedDuration,
      qualityRequirements: architectureRequest.qualityRequirements
    });
    
    // Set up specialized architecture environment
    await this.setupArchitectureEnvironment(collaboration, architectureRequest);
    
    return collaboration;
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private async loadAutonomyConfigurations(): Promise<void> {
    // Load saved autonomy configurations from storage
    // Implementation would load from database or file system
  }

  private async saveAutonomyConfigurations(): Promise<void> {
    // Save current autonomy configurations to storage
    // Implementation would save to database or file system
  }

  private async initializeAgentProfiles(): Promise<void> {
    // Initialize agent profiles with default values
    // Implementation would load existing profiles or create defaults
  }

  private async initializeMonitoringSystems(): Promise<void> {
    // Set up monitoring and alerting systems
    // Implementation would configure monitoring infrastructure
  }

  private generateCollaborationId(): string {
    return `collab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeMetrics(): AutonomyMetrics {
    return {
      totalCollaborations: 0,
      successfulCollaborations: 0,
      averageAutonomyLevel: 0,
      violationCount: 0,
      escalationCount: 0,
      userSatisfactionScore: 0
    };
  }

  private initializeCollaborationMetrics(): CollaborationMetrics {
    return {
      startTime: new Date(),
      messagesExchanged: 0,
      decisionsMode: 0,
      conflictsResolved: 0,
      qualityGatesPassed: 0,
      autonomyAdjustments: 0
    };
  }
}

// ============================================================================
// SUPPORTING INTERFACES
// ============================================================================

interface ActiveCollaboration {
  id: string;
  name: string;
  taskType: string;
  participants: string[];
  autonomyLevel: AutonomyLevel;
  autonomyControls: AutonomyControls;
  startTime: Date;
  status: 'initializing' | 'active' | 'paused' | 'completed' | 'failed';
  metrics: CollaborationMetrics;
}

interface CollaborationRequest {
  name: string;
  taskType: string;
  description: string;
  requirements: string[];
  expectedDuration: string;
  qualityRequirements: string[];
}

interface AgentDevelopmentRequest {
  agentName: string;
  description: string;
  requirements: string[];
  qualityRequirements: string[];
  targetCapabilities: string[];
  specializations: string[];
}

interface SystemArchitectureRequest {
  systemName: string;
  description: string;
  requirements: string[];
  qualityRequirements: string[];
  scalabilityRequirements: string[];
  securityRequirements: string[];
}

interface AutonomyViolation {
  type: string;
  agentId: string;
  collaborationId: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
}

interface ViolationResponse {
  action: string;
  restrictions: string[];
  escalation: boolean;
  notificationsSent: string[];
  timestamp: Date;
}

interface AutonomyMetrics {
  totalCollaborations: number;
  successfulCollaborations: number;
  averageAutonomyLevel: number;
  violationCount: number;
  escalationCount: number;
  userSatisfactionScore: number;
}

interface CollaborationMetrics {
  startTime: Date;
  messagesExchanged: number;
  decisionsMode: number;
  conflictsResolved: number;
  qualityGatesPassed: number;
  autonomyAdjustments: number;
}

// Register the extension
ExtensionRegistry.register(new AgentAutonomyControlExtension());

