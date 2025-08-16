/**
 * Collaborative Work Repository Extension
 * 
 * Manages multi-step projects, iterative refinements, feedback incorporation,
 * and cross-session continuity for collaborative AI work. Captures all collaborative
 * work that typically gets lost between conversations and enables seamless
 * continuation of complex projects.
 */

import { Extension } from './Extension';
import { UniversalGovernanceAdapter } from '../services/UniversalGovernanceAdapter';

// Core interfaces for collaborative work
export interface CollaborativeProject {
  id: string;
  name: string;
  description: string;
  type: 'research' | 'development' | 'analysis' | 'creative' | 'planning' | 'optimization' | 'documentation';
  status: 'planning' | 'active' | 'paused' | 'completed' | 'cancelled' | 'archived';
  priority: 'low' | 'medium' | 'high' | 'critical';
  
  // Project structure
  scope: {
    objectives: string[];
    deliverables: string[];
    constraints: string[];
    assumptions: string[];
    successCriteria: string[];
  };
  
  // Timeline and phases
  timeline: {
    startDate: Date;
    endDate?: Date;
    estimatedDuration: number; // in hours
    actualDuration?: number;
    milestones: ProjectMilestone[];
    phases: ProjectPhase[];
  };
  
  // Collaboration
  participants: {
    agents: string[];
    humans: string[];
    roles: Record<string, string[]>; // role -> participant IDs
    permissions: Record<string, string[]>; // participant -> permissions
  };
  
  // Progress tracking
  progress: {
    overallProgress: number; // 0-1
    phaseProgress: Record<string, number>;
    completedTasks: number;
    totalTasks: number;
    blockers: ProjectBlocker[];
    risks: ProjectRisk[];
  };
  
  // Quality and governance
  quality: {
    qualityScore: number; // 0-1
    reviewStatus: 'pending' | 'in_review' | 'approved' | 'rejected';
    reviewers: string[];
    qualityMetrics: Record<string, number>;
    complianceStatus: 'compliant' | 'non_compliant' | 'pending_review';
  };
  
  // Metadata
  metadata: {
    domain: string;
    complexity: 'low' | 'medium' | 'high' | 'very_high';
    businessValue: 'low' | 'medium' | 'high' | 'strategic';
    confidentiality: 'public' | 'internal' | 'confidential' | 'restricted';
    tags: string[];
    category: string;
    subcategory?: string;
  };
  
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  lastModifiedBy: string;
}

export interface ProjectMilestone {
  id: string;
  name: string;
  description: string;
  dueDate: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  deliverables: string[];
  dependencies: string[];
  completionCriteria: string[];
  actualCompletionDate?: Date;
  notes: string;
}

export interface ProjectPhase {
  id: string;
  name: string;
  description: string;
  order: number;
  status: 'not_started' | 'in_progress' | 'completed' | 'blocked';
  startDate?: Date;
  endDate?: Date;
  estimatedEffort: number; // in hours
  actualEffort?: number;
  tasks: ProjectTask[];
  deliverables: string[];
  dependencies: string[];
  exitCriteria: string[];
}

export interface ProjectTask {
  id: string;
  name: string;
  description: string;
  type: 'research' | 'analysis' | 'development' | 'review' | 'testing' | 'documentation' | 'communication';
  status: 'todo' | 'in_progress' | 'blocked' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignee?: string;
  estimatedEffort: number; // in hours
  actualEffort?: number;
  dueDate?: Date;
  completedDate?: Date;
  dependencies: string[];
  blockers: string[];
  notes: string;
  artifacts: string[]; // IDs of related artifacts
}

export interface ProjectBlocker {
  id: string;
  description: string;
  type: 'technical' | 'resource' | 'dependency' | 'approval' | 'external' | 'knowledge';
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'resolved' | 'mitigated' | 'accepted';
  affectedTasks: string[];
  resolutionPlan?: string;
  resolutionDate?: Date;
  owner: string;
  escalationLevel: number;
}

export interface ProjectRisk {
  id: string;
  description: string;
  category: 'technical' | 'schedule' | 'resource' | 'quality' | 'business' | 'external';
  probability: number; // 0-1
  impact: number; // 0-1
  riskScore: number; // probability * impact
  status: 'identified' | 'assessed' | 'mitigated' | 'accepted' | 'occurred';
  mitigationPlan?: string;
  contingencyPlan?: string;
  owner: string;
  reviewDate: Date;
}

export interface IterativeRefinement {
  id: string;
  projectId: string;
  artifactId: string;
  version: number;
  refinementType: 'enhancement' | 'bug_fix' | 'optimization' | 'feature_addition' | 'restructuring' | 'clarification';
  
  // Refinement details
  refinement: {
    description: string;
    rationale: string;
    scope: string[];
    approach: string;
    expectedOutcome: string;
    riskAssessment: string;
  };
  
  // Changes made
  changes: {
    additions: string[];
    modifications: string[];
    deletions: string[];
    restructuring: string[];
    impact: 'minor' | 'moderate' | 'major' | 'breaking';
  };
  
  // Quality assessment
  quality: {
    improvementScore: number; // 0-1
    qualityMetrics: Record<string, number>;
    validationResults: Record<string, any>;
    userFeedback?: string;
    reviewComments: string[];
  };
  
  // Collaboration
  collaboration: {
    initiatedBy: string;
    reviewers: string[];
    approvers: string[];
    contributors: string[];
    consensusLevel: number; // 0-1
  };
  
  // Metadata
  metadata: {
    effort: number; // hours
    complexity: 'low' | 'medium' | 'high';
    businessImpact: 'low' | 'medium' | 'high';
    urgency: 'low' | 'medium' | 'high';
    category: string;
    tags: string[];
  };
  
  createdAt: Date;
  completedAt?: Date;
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
}

export interface FeedbackIncorporation {
  id: string;
  projectId: string;
  feedbackSource: 'user' | 'peer_agent' | 'expert' | 'stakeholder' | 'automated_review';
  feedbackType: 'suggestion' | 'correction' | 'enhancement' | 'concern' | 'approval' | 'rejection';
  
  // Feedback content
  feedback: {
    content: string;
    context: string;
    specificity: 'general' | 'specific' | 'detailed';
    actionability: 'low' | 'medium' | 'high';
    priority: 'low' | 'medium' | 'high' | 'critical';
    sentiment: 'positive' | 'neutral' | 'negative' | 'mixed';
  };
  
  // Analysis
  analysis: {
    relevance: number; // 0-1
    feasibility: number; // 0-1
    impact: number; // 0-1
    effort: number; // hours
    riskLevel: 'low' | 'medium' | 'high';
    alignment: number; // 0-1 with project goals
  };
  
  // Incorporation
  incorporation: {
    status: 'pending' | 'accepted' | 'rejected' | 'deferred' | 'implemented';
    rationale: string;
    implementationPlan?: string;
    implementationDate?: Date;
    changes: string[];
    validation: string[];
  };
  
  // Collaboration
  collaboration: {
    discussionParticipants: string[];
    consensusLevel: number; // 0-1
    escalationRequired: boolean;
    approvalRequired: boolean;
    approvers: string[];
  };
  
  // Tracking
  tracking: {
    responseTime: number; // hours
    implementationTime?: number; // hours
    satisfactionScore?: number; // 0-1
    followUpRequired: boolean;
    followUpDate?: Date;
  };
  
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
}

export interface CrossSessionContinuity {
  id: string;
  projectId: string;
  sessionType: 'work_session' | 'review_session' | 'planning_session' | 'collaboration_session';
  
  // Session context
  context: {
    previousSession?: string;
    nextSession?: string;
    sessionGoals: string[];
    sessionScope: string[];
    participants: string[];
    duration: number; // minutes
  };
  
  // State preservation
  state: {
    workingMemory: Record<string, any>;
    activeContext: Record<string, any>;
    pendingDecisions: string[];
    openQuestions: string[];
    assumptions: string[];
    constraints: string[];
  };
  
  // Progress tracking
  progress: {
    accomplishments: string[];
    challenges: string[];
    blockers: string[];
    nextSteps: string[];
    carryOverItems: string[];
    deferredItems: string[];
  };
  
  // Handoff information
  handoff: {
    summary: string;
    keyDecisions: string[];
    importantContext: string[];
    warningsAlerts: string[];
    recommendations: string[];
    requiredFollowUp: string[];
  };
  
  // Quality and effectiveness
  effectiveness: {
    goalAchievement: number; // 0-1
    efficiency: number; // 0-1
    collaborationQuality: number; // 0-1
    knowledgeTransfer: number; // 0-1
    continuityScore: number; // 0-1
  };
  
  createdAt: Date;
  endedAt?: Date;
  status: 'active' | 'completed' | 'interrupted' | 'cancelled';
}

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  domain: string;
  
  // Template structure
  template: {
    phases: Omit<ProjectPhase, 'id' | 'status' | 'startDate' | 'endDate' | 'actualEffort'>[];
    milestones: Omit<ProjectMilestone, 'id' | 'status' | 'actualCompletionDate'>[];
    taskTemplates: Omit<ProjectTask, 'id' | 'status' | 'assignee' | 'actualEffort' | 'completedDate'>[];
    deliverableTemplates: string[];
    riskTemplates: Omit<ProjectRisk, 'id' | 'status' | 'owner' | 'reviewDate'>[];
  };
  
  // Customization
  customization: {
    configurableFields: string[];
    requiredFields: string[];
    optionalFields: string[];
    validationRules: Record<string, any>;
    defaultValues: Record<string, any>;
  };
  
  // Usage tracking
  usage: {
    usageCount: number;
    successRate: number; // 0-1
    averageDuration: number; // hours
    userSatisfaction: number; // 0-1
    adaptations: string[];
    improvements: string[];
  };
  
  // Metadata
  metadata: {
    complexity: 'low' | 'medium' | 'high';
    estimatedDuration: number; // hours
    recommendedTeamSize: number;
    skillRequirements: string[];
    toolRequirements: string[];
    tags: string[];
  };
  
  createdAt: Date;
  updatedAt: Date;
  version: string;
  createdBy: string;
}

export class CollaborativeWorkExtension extends Extension {
  private universalGovernance: UniversalGovernanceAdapter;
  private projects: Map<string, CollaborativeProject> = new Map();
  private refinements: Map<string, IterativeRefinement[]> = new Map();
  private feedbackItems: Map<string, FeedbackIncorporation[]> = new Map();
  private continuityData: Map<string, CrossSessionContinuity[]> = new Map();
  private templates: Map<string, ProjectTemplate> = new Map();

  constructor() {
    super('CollaborativeWorkExtension');
    this.universalGovernance = new UniversalGovernanceAdapter();
  }

  async initialize(): Promise<void> {
    await super.initialize();
    await this.universalGovernance.initialize();
    
    // Load existing collaborative work data
    await this.loadCollaborativeWorkData();
    
    // Initialize project templates
    await this.initializeProjectTemplates();
    
    this.logger.info('CollaborativeWorkExtension initialized successfully');
  }

  // Project Management
  async createProject(
    agentId: string,
    projectData: Omit<CollaborativeProject, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'lastModifiedBy'>
  ): Promise<CollaborativeProject> {
    try {
      // Validate project creation through governance
      const validationResult = await this.universalGovernance.validateCollaborativeDecision({
        type: 'project_creation',
        participants: [agentId, ...projectData.participants.agents],
        context: {
          projectType: projectData.type,
          complexity: projectData.metadata.complexity,
          businessValue: projectData.metadata.businessValue,
          confidentiality: projectData.metadata.confidentiality
        },
        riskLevel: this.calculateProjectRiskLevel(projectData)
      });

      if (!validationResult.approved) {
        throw new Error(`Project creation not approved: ${validationResult.reason}`);
      }

      const project: CollaborativeProject = {
        ...projectData,
        id: this.generateId(),
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: agentId,
        lastModifiedBy: agentId
      };

      this.projects.set(project.id, project);

      // Create audit entry
      await this.universalGovernance.createAuditEntry({
        agentId,
        action: 'project_created',
        resourceType: 'collaborative_project',
        resourceId: project.id,
        details: {
          projectName: project.name,
          projectType: project.type,
          complexity: project.metadata.complexity,
          participants: project.participants.agents.length + project.participants.humans.length
        },
        riskLevel: this.calculateProjectRiskLevel(project),
        timestamp: new Date()
      });

      this.logger.info(`Created collaborative project: ${project.name} (${project.id})`);
      return project;
    } catch (error) {
      this.logger.error('Failed to create project:', error);
      throw error;
    }
  }

  async updateProject(
    agentId: string,
    projectId: string,
    updates: Partial<CollaborativeProject>
  ): Promise<CollaborativeProject> {
    try {
      const project = this.projects.get(projectId);
      if (!project) {
        throw new Error(`Project not found: ${projectId}`);
      }

      // Validate update through governance
      const validationResult = await this.universalGovernance.validateCollaborativeDecision({
        type: 'project_update',
        participants: [agentId, ...project.participants.agents],
        context: {
          projectId,
          updateType: Object.keys(updates).join(', '),
          currentStatus: project.status
        },
        riskLevel: this.calculateUpdateRiskLevel(project, updates)
      });

      if (!validationResult.approved) {
        throw new Error(`Project update not approved: ${validationResult.reason}`);
      }

      const updatedProject: CollaborativeProject = {
        ...project,
        ...updates,
        updatedAt: new Date(),
        lastModifiedBy: agentId
      };

      this.projects.set(projectId, updatedProject);

      // Create audit entry
      await this.universalGovernance.createAuditEntry({
        agentId,
        action: 'project_updated',
        resourceType: 'collaborative_project',
        resourceId: projectId,
        details: {
          updatedFields: Object.keys(updates),
          previousStatus: project.status,
          newStatus: updatedProject.status
        },
        riskLevel: this.calculateUpdateRiskLevel(project, updates),
        timestamp: new Date()
      });

      return updatedProject;
    } catch (error) {
      this.logger.error('Failed to update project:', error);
      throw error;
    }
  }

  async getProject(projectId: string): Promise<CollaborativeProject | null> {
    return this.projects.get(projectId) || null;
  }

  async searchProjects(
    agentId: string,
    query: {
      keywords?: string[];
      type?: string;
      status?: string;
      priority?: string;
      participant?: string;
      domain?: string;
      complexity?: string;
      businessValue?: string;
    }
  ): Promise<CollaborativeProject[]> {
    try {
      let results = Array.from(this.projects.values());

      // Apply filters
      if (query.keywords) {
        const keywords = query.keywords.map(k => k.toLowerCase());
        results = results.filter(project =>
          keywords.some(keyword =>
            project.name.toLowerCase().includes(keyword) ||
            project.description.toLowerCase().includes(keyword) ||
            project.metadata.tags.some(tag => tag.toLowerCase().includes(keyword))
          )
        );
      }

      if (query.type) {
        results = results.filter(project => project.type === query.type);
      }

      if (query.status) {
        results = results.filter(project => project.status === query.status);
      }

      if (query.priority) {
        results = results.filter(project => project.priority === query.priority);
      }

      if (query.participant) {
        results = results.filter(project =>
          project.participants.agents.includes(query.participant!) ||
          project.participants.humans.includes(query.participant!)
        );
      }

      if (query.domain) {
        results = results.filter(project => project.metadata.domain === query.domain);
      }

      if (query.complexity) {
        results = results.filter(project => project.metadata.complexity === query.complexity);
      }

      if (query.businessValue) {
        results = results.filter(project => project.metadata.businessValue === query.businessValue);
      }

      // Sort by relevance and recency
      results.sort((a, b) => {
        // Priority first
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;

        // Then by update time
        return b.updatedAt.getTime() - a.updatedAt.getTime();
      });

      return results;
    } catch (error) {
      this.logger.error('Failed to search projects:', error);
      return [];
    }
  }

  // Iterative Refinement
  async createRefinement(
    agentId: string,
    refinementData: Omit<IterativeRefinement, 'id' | 'createdAt' | 'completedAt' | 'status'>
  ): Promise<IterativeRefinement> {
    try {
      // Validate refinement through governance
      const validationResult = await this.universalGovernance.validateCollaborativeDecision({
        type: 'refinement_creation',
        participants: [agentId, ...refinementData.collaboration.reviewers],
        context: {
          projectId: refinementData.projectId,
          refinementType: refinementData.refinementType,
          impact: refinementData.changes.impact,
          complexity: refinementData.metadata.complexity
        },
        riskLevel: this.calculateRefinementRiskLevel(refinementData)
      });

      if (!validationResult.approved) {
        throw new Error(`Refinement creation not approved: ${validationResult.reason}`);
      }

      const refinement: IterativeRefinement = {
        ...refinementData,
        id: this.generateId(),
        createdAt: new Date(),
        status: 'planned'
      };

      const projectRefinements = this.refinements.get(refinementData.projectId) || [];
      projectRefinements.push(refinement);
      this.refinements.set(refinementData.projectId, projectRefinements);

      // Create audit entry
      await this.universalGovernance.createAuditEntry({
        agentId,
        action: 'refinement_created',
        resourceType: 'iterative_refinement',
        resourceId: refinement.id,
        details: {
          projectId: refinementData.projectId,
          refinementType: refinementData.refinementType,
          impact: refinementData.changes.impact,
          version: refinementData.version
        },
        riskLevel: this.calculateRefinementRiskLevel(refinementData),
        timestamp: new Date()
      });

      return refinement;
    } catch (error) {
      this.logger.error('Failed to create refinement:', error);
      throw error;
    }
  }

  async completeRefinement(
    agentId: string,
    refinementId: string,
    results: {
      qualityMetrics: Record<string, number>;
      validationResults: Record<string, any>;
      userFeedback?: string;
      reviewComments: string[];
    }
  ): Promise<IterativeRefinement> {
    try {
      // Find refinement
      let refinement: IterativeRefinement | null = null;
      let projectId: string | null = null;

      for (const [pid, refinements] of this.refinements.entries()) {
        const found = refinements.find(r => r.id === refinementId);
        if (found) {
          refinement = found;
          projectId = pid;
          break;
        }
      }

      if (!refinement || !projectId) {
        throw new Error(`Refinement not found: ${refinementId}`);
      }

      // Update refinement
      refinement.status = 'completed';
      refinement.completedAt = new Date();
      refinement.quality = {
        ...refinement.quality,
        ...results
      };

      // Calculate improvement score
      refinement.quality.improvementScore = this.calculateImprovementScore(results.qualityMetrics);

      // Create audit entry
      await this.universalGovernance.createAuditEntry({
        agentId,
        action: 'refinement_completed',
        resourceType: 'iterative_refinement',
        resourceId: refinementId,
        details: {
          projectId,
          improvementScore: refinement.quality.improvementScore,
          qualityMetrics: Object.keys(results.qualityMetrics).length
        },
        riskLevel: 'low',
        timestamp: new Date()
      });

      return refinement;
    } catch (error) {
      this.logger.error('Failed to complete refinement:', error);
      throw error;
    }
  }

  // Feedback Incorporation
  async incorporateFeedback(
    agentId: string,
    feedbackData: Omit<FeedbackIncorporation, 'id' | 'createdAt' | 'updatedAt' | 'resolvedAt'>
  ): Promise<FeedbackIncorporation> {
    try {
      // Validate feedback incorporation through governance
      const validationResult = await this.universalGovernance.validateCollaborativeDecision({
        type: 'feedback_incorporation',
        participants: [agentId, ...feedbackData.collaboration.discussionParticipants],
        context: {
          projectId: feedbackData.projectId,
          feedbackType: feedbackData.feedbackType,
          priority: feedbackData.feedback.priority,
          impact: feedbackData.analysis.impact
        },
        riskLevel: feedbackData.analysis.riskLevel
      });

      if (!validationResult.approved) {
        throw new Error(`Feedback incorporation not approved: ${validationResult.reason}`);
      }

      const feedback: FeedbackIncorporation = {
        ...feedbackData,
        id: this.generateId(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const projectFeedback = this.feedbackItems.get(feedbackData.projectId) || [];
      projectFeedback.push(feedback);
      this.feedbackItems.set(feedbackData.projectId, projectFeedback);

      // Create audit entry
      await this.universalGovernance.createAuditEntry({
        agentId,
        action: 'feedback_incorporated',
        resourceType: 'feedback_incorporation',
        resourceId: feedback.id,
        details: {
          projectId: feedbackData.projectId,
          feedbackType: feedbackData.feedbackType,
          source: feedbackData.feedbackSource,
          priority: feedbackData.feedback.priority
        },
        riskLevel: feedbackData.analysis.riskLevel,
        timestamp: new Date()
      });

      return feedback;
    } catch (error) {
      this.logger.error('Failed to incorporate feedback:', error);
      throw error;
    }
  }

  // Cross-Session Continuity
  async createSessionContinuity(
    agentId: string,
    continuityData: Omit<CrossSessionContinuity, 'id' | 'createdAt' | 'endedAt' | 'status'>
  ): Promise<CrossSessionContinuity> {
    try {
      const continuity: CrossSessionContinuity = {
        ...continuityData,
        id: this.generateId(),
        createdAt: new Date(),
        status: 'active'
      };

      const projectContinuity = this.continuityData.get(continuityData.projectId) || [];
      projectContinuity.push(continuity);
      this.continuityData.set(continuityData.projectId, projectContinuity);

      // Create audit entry
      await this.universalGovernance.createAuditEntry({
        agentId,
        action: 'session_started',
        resourceType: 'cross_session_continuity',
        resourceId: continuity.id,
        details: {
          projectId: continuityData.projectId,
          sessionType: continuityData.sessionType,
          participants: continuityData.context.participants.length
        },
        riskLevel: 'low',
        timestamp: new Date()
      });

      return continuity;
    } catch (error) {
      this.logger.error('Failed to create session continuity:', error);
      throw error;
    }
  }

  async endSession(
    agentId: string,
    sessionId: string,
    handoffInfo: {
      summary: string;
      keyDecisions: string[];
      importantContext: string[];
      warningsAlerts: string[];
      recommendations: string[];
      requiredFollowUp: string[];
    },
    effectiveness: {
      goalAchievement: number;
      efficiency: number;
      collaborationQuality: number;
      knowledgeTransfer: number;
    }
  ): Promise<CrossSessionContinuity> {
    try {
      // Find session
      let session: CrossSessionContinuity | null = null;
      let projectId: string | null = null;

      for (const [pid, sessions] of this.continuityData.entries()) {
        const found = sessions.find(s => s.id === sessionId);
        if (found) {
          session = found;
          projectId = pid;
          break;
        }
      }

      if (!session || !projectId) {
        throw new Error(`Session not found: ${sessionId}`);
      }

      // Update session
      session.status = 'completed';
      session.endedAt = new Date();
      session.handoff = handoffInfo;
      session.effectiveness = {
        ...effectiveness,
        continuityScore: this.calculateContinuityScore(session, handoffInfo, effectiveness)
      };

      // Create audit entry
      await this.universalGovernance.createAuditEntry({
        agentId,
        action: 'session_ended',
        resourceType: 'cross_session_continuity',
        resourceId: sessionId,
        details: {
          projectId,
          duration: session.context.duration,
          continuityScore: session.effectiveness.continuityScore,
          followUpItems: handoffInfo.requiredFollowUp.length
        },
        riskLevel: 'low',
        timestamp: new Date()
      });

      return session;
    } catch (error) {
      this.logger.error('Failed to end session:', error);
      throw error;
    }
  }

  // Project Templates
  async createProjectTemplate(
    agentId: string,
    templateData: Omit<ProjectTemplate, 'id' | 'createdAt' | 'updatedAt' | 'version' | 'createdBy'>
  ): Promise<ProjectTemplate> {
    try {
      const template: ProjectTemplate = {
        ...templateData,
        id: this.generateId(),
        createdAt: new Date(),
        updatedAt: new Date(),
        version: '1.0.0',
        createdBy: agentId
      };

      this.templates.set(template.id, template);

      // Create audit entry
      await this.universalGovernance.createAuditEntry({
        agentId,
        action: 'template_created',
        resourceType: 'project_template',
        resourceId: template.id,
        details: {
          templateName: template.name,
          category: template.category,
          domain: template.domain,
          complexity: template.metadata.complexity
        },
        riskLevel: 'low',
        timestamp: new Date()
      });

      return template;
    } catch (error) {
      this.logger.error('Failed to create project template:', error);
      throw error;
    }
  }

  async createProjectFromTemplate(
    agentId: string,
    templateId: string,
    customization: {
      name: string;
      description: string;
      participants: { agents: string[]; humans: string[] };
      customFields: Record<string, any>;
    }
  ): Promise<CollaborativeProject> {
    try {
      const template = this.templates.get(templateId);
      if (!template) {
        throw new Error(`Template not found: ${templateId}`);
      }

      // Create project from template
      const projectData: Omit<CollaborativeProject, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'lastModifiedBy'> = {
        name: customization.name,
        description: customization.description,
        type: 'development', // Default, can be customized
        status: 'planning',
        priority: 'medium',
        scope: {
          objectives: [],
          deliverables: template.template.deliverableTemplates,
          constraints: [],
          assumptions: [],
          successCriteria: []
        },
        timeline: {
          startDate: new Date(),
          estimatedDuration: template.metadata.estimatedDuration,
          milestones: template.template.milestones.map(m => ({
            ...m,
            id: this.generateId(),
            status: 'pending' as const,
            actualCompletionDate: undefined
          })),
          phases: template.template.phases.map(p => ({
            ...p,
            id: this.generateId(),
            status: 'not_started' as const,
            startDate: undefined,
            endDate: undefined,
            actualEffort: undefined,
            tasks: p.tasks.map(t => ({
              ...t,
              id: this.generateId(),
              status: 'todo' as const,
              assignee: undefined,
              actualEffort: undefined,
              completedDate: undefined,
              artifacts: []
            }))
          }))
        },
        participants: {
          ...customization.participants,
          roles: {},
          permissions: {}
        },
        progress: {
          overallProgress: 0,
          phaseProgress: {},
          completedTasks: 0,
          totalTasks: template.template.phases.reduce((sum, phase) => sum + phase.tasks.length, 0),
          blockers: [],
          risks: template.template.riskTemplates.map(r => ({
            ...r,
            id: this.generateId(),
            status: 'identified' as const,
            owner: agentId,
            reviewDate: new Date()
          }))
        },
        quality: {
          qualityScore: 0,
          reviewStatus: 'pending',
          reviewers: [],
          qualityMetrics: {},
          complianceStatus: 'pending_review'
        },
        metadata: {
          domain: template.domain,
          complexity: template.metadata.complexity,
          businessValue: 'medium',
          confidentiality: 'internal',
          tags: template.metadata.tags,
          category: template.category,
          subcategory: undefined
        }
      };

      // Apply customizations
      Object.assign(projectData, customization.customFields);

      const project = await this.createProject(agentId, projectData);

      // Update template usage
      template.usage.usageCount++;
      template.updatedAt = new Date();

      return project;
    } catch (error) {
      this.logger.error('Failed to create project from template:', error);
      throw error;
    }
  }

  // Analytics and Insights
  async getCollaborativeWorkAnalytics(agentId: string): Promise<any> {
    try {
      const projects = Array.from(this.projects.values());
      const allRefinements = Array.from(this.refinements.values()).flat();
      const allFeedback = Array.from(this.feedbackItems.values()).flat();
      const allSessions = Array.from(this.continuityData.values()).flat();

      return {
        projectMetrics: {
          totalProjects: projects.length,
          activeProjects: projects.filter(p => p.status === 'active').length,
          completedProjects: projects.filter(p => p.status === 'completed').length,
          averageProjectDuration: this.calculateAverageProjectDuration(projects),
          successRate: this.calculateProjectSuccessRate(projects),
          collaborationEffectiveness: this.calculateCollaborationEffectiveness(projects)
        },
        refinementMetrics: {
          totalRefinements: allRefinements.length,
          averageImprovementScore: this.calculateAverageImprovementScore(allRefinements),
          refinementVelocity: this.calculateRefinementVelocity(allRefinements),
          qualityTrend: this.calculateQualityTrend(allRefinements)
        },
        feedbackMetrics: {
          totalFeedbackItems: allFeedback.length,
          incorporationRate: this.calculateFeedbackIncorporationRate(allFeedback),
          averageResponseTime: this.calculateAverageFeedbackResponseTime(allFeedback),
          satisfactionScore: this.calculateFeedbackSatisfactionScore(allFeedback)
        },
        continuityMetrics: {
          totalSessions: allSessions.length,
          averageContinuityScore: this.calculateAverageContinuityScore(allSessions),
          knowledgeTransferEffectiveness: this.calculateKnowledgeTransferEffectiveness(allSessions),
          sessionEfficiency: this.calculateSessionEfficiency(allSessions)
        },
        recommendations: this.generateCollaborativeWorkRecommendations(projects, allRefinements, allFeedback, allSessions)
      };
    } catch (error) {
      this.logger.error('Failed to get collaborative work analytics:', error);
      return null;
    }
  }

  // Helper methods
  private async loadCollaborativeWorkData(): Promise<void> {
    // In a real implementation, this would load from persistent storage
    this.logger.info('Loading collaborative work data...');
  }

  private async initializeProjectTemplates(): Promise<void> {
    // Initialize common project templates
    const commonTemplates = [
      {
        name: 'Research Project',
        description: 'Template for research and analysis projects',
        category: 'research',
        domain: 'general'
      },
      {
        name: 'Development Project',
        description: 'Template for software development projects',
        category: 'development',
        domain: 'technology'
      },
      {
        name: 'Analysis Project',
        description: 'Template for data analysis and insights projects',
        category: 'analysis',
        domain: 'data'
      }
    ];

    // Create templates (simplified for brevity)
    for (const templateData of commonTemplates) {
      // Create full template structure...
    }
  }

  private calculateProjectRiskLevel(project: Omit<CollaborativeProject, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'lastModifiedBy'>): 'low' | 'medium' | 'high' {
    let riskScore = 0;

    // Complexity factor
    const complexityScores = { low: 1, medium: 2, high: 3, very_high: 4 };
    riskScore += complexityScores[project.metadata.complexity];

    // Confidentiality factor
    const confidentialityScores = { public: 1, internal: 2, confidential: 3, restricted: 4 };
    riskScore += confidentialityScores[project.metadata.confidentiality];

    // Participant count factor
    const totalParticipants = project.participants.agents.length + project.participants.humans.length;
    if (totalParticipants > 10) riskScore += 2;
    else if (totalParticipants > 5) riskScore += 1;

    if (riskScore >= 7) return 'high';
    if (riskScore >= 4) return 'medium';
    return 'low';
  }

  private calculateUpdateRiskLevel(project: CollaborativeProject, updates: Partial<CollaborativeProject>): 'low' | 'medium' | 'high' {
    let riskScore = 0;

    // Status change risk
    if (updates.status && updates.status !== project.status) {
      if (updates.status === 'cancelled' || updates.status === 'archived') riskScore += 3;
      else if (updates.status === 'completed') riskScore += 1;
    }

    // Participant changes
    if (updates.participants) {
      riskScore += 2;
    }

    // Scope changes
    if (updates.scope) {
      riskScore += 2;
    }

    if (riskScore >= 5) return 'high';
    if (riskScore >= 3) return 'medium';
    return 'low';
  }

  private calculateRefinementRiskLevel(refinement: Omit<IterativeRefinement, 'id' | 'createdAt' | 'completedAt' | 'status'>): 'low' | 'medium' | 'high' {
    let riskScore = 0;

    // Impact factor
    const impactScores = { minor: 1, moderate: 2, major: 3, breaking: 4 };
    riskScore += impactScores[refinement.changes.impact];

    // Complexity factor
    const complexityScores = { low: 1, medium: 2, high: 3 };
    riskScore += complexityScores[refinement.metadata.complexity];

    if (riskScore >= 6) return 'high';
    if (riskScore >= 4) return 'medium';
    return 'low';
  }

  private calculateImprovementScore(qualityMetrics: Record<string, number>): number {
    const values = Object.values(qualityMetrics);
    return values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0.5;
  }

  private calculateContinuityScore(
    session: CrossSessionContinuity,
    handoff: any,
    effectiveness: any
  ): number {
    // Calculate based on handoff quality and effectiveness metrics
    const handoffScore = (handoff.keyDecisions.length + handoff.importantContext.length + handoff.recommendations.length) / 15;
    const effectivenessScore = (effectiveness.goalAchievement + effectiveness.efficiency + effectiveness.collaborationQuality + effectiveness.knowledgeTransfer) / 4;
    
    return Math.min(1, (handoffScore + effectivenessScore) / 2);
  }

  private calculateAverageProjectDuration(projects: CollaborativeProject[]): number {
    const completedProjects = projects.filter(p => p.status === 'completed' && p.timeline.actualDuration);
    if (completedProjects.length === 0) return 0;
    
    const totalDuration = completedProjects.reduce((sum, p) => sum + (p.timeline.actualDuration || 0), 0);
    return totalDuration / completedProjects.length;
  }

  private calculateProjectSuccessRate(projects: CollaborativeProject[]): number {
    const completedProjects = projects.filter(p => p.status === 'completed' || p.status === 'cancelled');
    if (completedProjects.length === 0) return 0;
    
    const successfulProjects = completedProjects.filter(p => p.status === 'completed' && p.quality.qualityScore >= 0.7);
    return successfulProjects.length / completedProjects.length;
  }

  private calculateCollaborationEffectiveness(projects: CollaborativeProject[]): number {
    // Calculate based on project quality scores and participant satisfaction
    const projectsWithQuality = projects.filter(p => p.quality.qualityScore > 0);
    if (projectsWithQuality.length === 0) return 0.5;
    
    const averageQuality = projectsWithQuality.reduce((sum, p) => sum + p.quality.qualityScore, 0) / projectsWithQuality.length;
    return averageQuality;
  }

  private calculateAverageImprovementScore(refinements: IterativeRefinement[]): number {
    const completedRefinements = refinements.filter(r => r.status === 'completed' && r.quality.improvementScore);
    if (completedRefinements.length === 0) return 0;
    
    const totalScore = completedRefinements.reduce((sum, r) => sum + r.quality.improvementScore, 0);
    return totalScore / completedRefinements.length;
  }

  private calculateRefinementVelocity(refinements: IterativeRefinement[]): number {
    // Calculate refinements per week
    if (refinements.length === 0) return 0;
    
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const recentRefinements = refinements.filter(r => r.createdAt >= oneWeekAgo);
    
    return recentRefinements.length;
  }

  private calculateQualityTrend(refinements: IterativeRefinement[]): string {
    const completedRefinements = refinements
      .filter(r => r.status === 'completed' && r.quality.improvementScore)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    
    if (completedRefinements.length < 2) return 'stable';
    
    const recent = completedRefinements.slice(-5);
    const older = completedRefinements.slice(-10, -5);
    
    if (recent.length === 0 || older.length === 0) return 'stable';
    
    const recentAvg = recent.reduce((sum, r) => sum + r.quality.improvementScore, 0) / recent.length;
    const olderAvg = older.reduce((sum, r) => sum + r.quality.improvementScore, 0) / older.length;
    
    if (recentAvg > olderAvg + 0.1) return 'improving';
    if (recentAvg < olderAvg - 0.1) return 'declining';
    return 'stable';
  }

  private calculateFeedbackIncorporationRate(feedback: FeedbackIncorporation[]): number {
    if (feedback.length === 0) return 0;
    
    const implementedFeedback = feedback.filter(f => f.incorporation.status === 'implemented');
    return implementedFeedback.length / feedback.length;
  }

  private calculateAverageFeedbackResponseTime(feedback: FeedbackIncorporation[]): number {
    const resolvedFeedback = feedback.filter(f => f.resolvedAt && f.tracking.responseTime);
    if (resolvedFeedback.length === 0) return 0;
    
    const totalResponseTime = resolvedFeedback.reduce((sum, f) => sum + f.tracking.responseTime, 0);
    return totalResponseTime / resolvedFeedback.length;
  }

  private calculateFeedbackSatisfactionScore(feedback: FeedbackIncorporation[]): number {
    const feedbackWithSatisfaction = feedback.filter(f => f.tracking.satisfactionScore !== undefined);
    if (feedbackWithSatisfaction.length === 0) return 0.5;
    
    const totalSatisfaction = feedbackWithSatisfaction.reduce((sum, f) => sum + (f.tracking.satisfactionScore || 0), 0);
    return totalSatisfaction / feedbackWithSatisfaction.length;
  }

  private calculateAverageContinuityScore(sessions: CrossSessionContinuity[]): number {
    const completedSessions = sessions.filter(s => s.status === 'completed' && s.effectiveness?.continuityScore);
    if (completedSessions.length === 0) return 0.5;
    
    const totalScore = completedSessions.reduce((sum, s) => sum + (s.effectiveness?.continuityScore || 0), 0);
    return totalScore / completedSessions.length;
  }

  private calculateKnowledgeTransferEffectiveness(sessions: CrossSessionContinuity[]): number {
    const completedSessions = sessions.filter(s => s.status === 'completed' && s.effectiveness?.knowledgeTransfer);
    if (completedSessions.length === 0) return 0.5;
    
    const totalScore = completedSessions.reduce((sum, s) => sum + (s.effectiveness?.knowledgeTransfer || 0), 0);
    return totalScore / completedSessions.length;
  }

  private calculateSessionEfficiency(sessions: CrossSessionContinuity[]): number {
    const completedSessions = sessions.filter(s => s.status === 'completed' && s.effectiveness?.efficiency);
    if (completedSessions.length === 0) return 0.5;
    
    const totalScore = completedSessions.reduce((sum, s) => sum + (s.effectiveness?.efficiency || 0), 0);
    return totalScore / completedSessions.length;
  }

  private generateCollaborativeWorkRecommendations(
    projects: CollaborativeProject[],
    refinements: IterativeRefinement[],
    feedback: FeedbackIncorporation[],
    sessions: CrossSessionContinuity[]
  ): string[] {
    const recommendations: string[] = [];

    // Project recommendations
    const activeProjects = projects.filter(p => p.status === 'active');
    if (activeProjects.length > 10) {
      recommendations.push('Consider consolidating or prioritizing active projects to improve focus');
    }

    // Quality recommendations
    const lowQualityProjects = projects.filter(p => p.quality.qualityScore < 0.6);
    if (lowQualityProjects.length > 0) {
      recommendations.push('Focus on improving quality processes for better project outcomes');
    }

    // Collaboration recommendations
    const collaborationScore = this.calculateCollaborationEffectiveness(projects);
    if (collaborationScore < 0.7) {
      recommendations.push('Enhance collaboration practices and communication protocols');
    }

    // Feedback recommendations
    const incorporationRate = this.calculateFeedbackIncorporationRate(feedback);
    if (incorporationRate < 0.6) {
      recommendations.push('Improve feedback incorporation processes and response times');
    }

    // Continuity recommendations
    const continuityScore = this.calculateAverageContinuityScore(sessions);
    if (continuityScore < 0.7) {
      recommendations.push('Strengthen session handoff procedures and context preservation');
    }

    return recommendations;
  }

  private generateId(): string {
    return `collab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

