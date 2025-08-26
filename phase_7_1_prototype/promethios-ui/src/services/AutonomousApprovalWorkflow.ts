/**
 * Autonomous Approval Workflow System
 * 
 * User-friendly approval workflow system that provides simple, intuitive interfaces
 * while leveraging sophisticated backend governance processing.
 * 
 * Design Principles:
 * - Progressive disclosure (simple → detailed as needed)
 * - Natural language explanations
 * - Smart defaults and auto-approvals
 * - One-click actions for users
 * - Clear visual feedback
 * - Minimal user interruption
 * 
 * Key Features:
 * - Simplified approval notifications
 * - Auto-approval for low-risk actions
 * - Plain English explanations
 * - Visual progress indicators
 * - Smart escalation handling
 * - User preference learning
 */

import { EnhancedGovernanceProcessor, GovernanceDecision } from './EnhancedGovernanceProcessor';
import { UniversalGovernanceAdapter } from './UniversalGovernanceAdapter';
import { 
  AutonomousTaskPlan, 
  AutonomousPhase, 
  AutonomousGovernanceContext 
} from './AutonomousGovernanceExtension';

// ============================================================================
// USER-FRIENDLY APPROVAL TYPES
// ============================================================================

export interface UserFriendlyApprovalRequest {
  id: string;
  type: 'phase_approval' | 'tool_approval' | 'plan_modification' | 'high_risk_action';
  
  // Simple, user-friendly fields
  title: string;                    // "Agent wants to start Phase 2: Data Analysis"
  description: string;              // "The agent will search for market data and create charts"
  risk_level: 'low' | 'medium' | 'high';
  estimated_time: string;           // "About 15 minutes"
  
  // Visual elements
  icon: string;                     // 📊, 🔍, ⚠️, etc.
  color: 'green' | 'yellow' | 'red'; // Visual risk indicator
  progress_context: string;         // "Step 2 of 4 in your workflow"
  
  // User actions
  primary_action: ApprovalAction;   // Main "Approve" button
  secondary_actions: ApprovalAction[]; // "Pause", "Modify", "Details"
  
  // Context for power users (hidden by default)
  technical_details?: TechnicalDetails;
  
  // Auto-handling
  auto_approve_in?: number;         // Seconds until auto-approval (for low-risk)
  can_be_auto_approved: boolean;
  
  // User preferences
  user_preference_hint?: string;    // "You usually approve data analysis tasks"
  
  timestamp: string;
  expires_at?: string;
}

export interface ApprovalAction {
  id: string;
  label: string;                    // "Approve", "Pause Workflow", "See Details"
  description: string;              // "Let the agent continue with this step"
  style: 'primary' | 'secondary' | 'warning' | 'danger';
  icon?: string;
  confirmation_required?: boolean;  // For destructive actions
  confirmation_message?: string;
}

export interface TechnicalDetails {
  governance_score: number;
  risk_factors: string[];
  compliance_frameworks: string[];
  tools_to_be_used: string[];
  resource_impact: {
    estimated_cost: number;
    estimated_duration: number;
    tools_count: number;
  };
  precedent_info?: string;
}

export interface UserApprovalResponse {
  request_id: string;
  action_taken: string;             // 'approve', 'reject', 'pause', 'modify'
  user_comment?: string;
  remember_preference?: boolean;    // "Always approve data analysis tasks"
  timestamp: string;
}

export interface ApprovalNotification {
  id: string;
  type: 'approval_granted' | 'approval_denied' | 'auto_approved' | 'escalated' | 'expired';
  title: string;
  message: string;
  icon: string;
  color: string;
  actions?: NotificationAction[];
  auto_dismiss_in?: number;         // Seconds
  timestamp: string;
}

export interface NotificationAction {
  label: string;
  action: string;
  style: 'primary' | 'secondary';
}

export interface UserPreferences {
  user_id: string;
  
  // Approval preferences
  auto_approve_low_risk: boolean;
  auto_approve_data_analysis: boolean;
  auto_approve_content_creation: boolean;
  auto_approve_research_tasks: boolean;
  
  // Notification preferences
  notification_style: 'minimal' | 'standard' | 'detailed';
  show_technical_details: boolean;
  notification_channels: ('in_app' | 'email' | 'slack')[];
  
  // Workflow preferences
  preferred_approval_timeout: number; // minutes
  pause_on_high_risk: boolean;
  require_confirmation_for_costs_over: number; // dollars
  
  // Learning preferences
  learn_from_approvals: boolean;
  suggest_workflow_improvements: boolean;
  
  updated_at: string;
}

export interface WorkflowProgress {
  workflow_id: string;
  current_phase: number;
  total_phases: number;
  phase_title: string;
  overall_progress: number;         // 0-100
  estimated_completion: string;
  
  // User-friendly status
  status_message: string;           // "Working on data analysis..."
  next_milestone: string;           // "Charts and insights ready in ~10 minutes"
  
  // Visual elements
  progress_color: 'blue' | 'green' | 'yellow' | 'red';
  status_icon: string;
  
  // Recent activity (user-friendly)
  recent_activities: ActivitySummary[];
  
  // Pending approvals
  pending_approvals: UserFriendlyApprovalRequest[];
  
  last_updated: string;
}

export interface ActivitySummary {
  timestamp: string;
  activity: string;                 // "Searched for market data"
  result: string;                   // "Found 15 relevant sources"
  icon: string;
  duration?: string;                // "2 minutes"
}

// ============================================================================
// AUTONOMOUS APPROVAL WORKFLOW CLASS
// ============================================================================

export class AutonomousApprovalWorkflow {
  private static instance: AutonomousApprovalWorkflow;
  
  // Core service integrations
  private governanceProcessor: EnhancedGovernanceProcessor;
  private governanceAdapter: UniversalGovernanceAdapter;
  
  // User-friendly workflow management
  private activeApprovalRequests: Map<string, UserFriendlyApprovalRequest> = new Map();
  private userPreferences: Map<string, UserPreferences> = new Map();
  private workflowProgress: Map<string, WorkflowProgress> = new Map();
  
  // Auto-approval timers
  private autoApprovalTimers: Map<string, NodeJS.Timeout> = new Map();
  
  // Notification callbacks
  private notificationCallbacks: ((notification: ApprovalNotification) => void)[] = [];

  private constructor() {
    console.log('🎯 [Approval Workflow] Initializing user-friendly approval workflow system');
    
    this.governanceProcessor = EnhancedGovernanceProcessor.getInstance();
    this.governanceAdapter = UniversalGovernanceAdapter.getInstance();
    
    // Initialize default user preferences
    this.initializeDefaultPreferences();
    
    console.log('✅ [Approval Workflow] Autonomous Approval Workflow initialized');
  }

  static getInstance(): AutonomousApprovalWorkflow {
    if (!AutonomousApprovalWorkflow.instance) {
      AutonomousApprovalWorkflow.instance = new AutonomousApprovalWorkflow();
    }
    return AutonomousApprovalWorkflow.instance;
  }

  // ============================================================================
  // USER-FRIENDLY APPROVAL PROCESSING
  // ============================================================================

  /**
   * Process approval request with user-friendly interface
   */
  async requestApproval(
    plan: AutonomousTaskPlan,
    phase: AutonomousPhase,
    governanceContext: AutonomousGovernanceContext,
    approvalType: 'phase_approval' | 'tool_approval' | 'plan_modification' | 'high_risk_action',
    additionalContext?: any
  ): Promise<UserFriendlyApprovalRequest> {
    
    console.log(`🎯 [Approval Workflow] Creating user-friendly approval request: ${approvalType}`);

    // Get governance decision from enhanced processor
    const governanceDecision = await this.governanceProcessor.processAutonomousPlanApproval(
      plan, 
      this.convertToGovernanceContext(governanceContext)
    );

    // Get user preferences
    const userPrefs = this.getUserPreferences(governanceContext.userId);

    // Create user-friendly approval request
    const approvalRequest = await this.createUserFriendlyRequest(
      plan,
      phase,
      governanceDecision,
      approvalType,
      userPrefs,
      additionalContext
    );

    // Check if this can be auto-approved
    if (this.canAutoApprove(approvalRequest, governanceDecision, userPrefs)) {
      console.log(`⚡ [Approval Workflow] Auto-approving low-risk request: ${approvalRequest.id}`);
      
      // Set auto-approval timer
      this.setAutoApprovalTimer(approvalRequest);
      
      // Send auto-approval notification
      this.sendNotification({
        id: `notification_${Date.now()}`,
        type: 'auto_approved',
        title: '✅ Auto-Approved',
        message: `${approvalRequest.title} - Will proceed automatically in ${approvalRequest.auto_approve_in} seconds`,
        icon: '⚡',
        color: 'green',
        actions: [{
          label: 'Cancel Auto-Approval',
          action: 'cancel_auto_approval',
          style: 'secondary'
        }],
        auto_dismiss_in: approvalRequest.auto_approve_in,
        timestamp: new Date().toISOString()
      });
    } else {
      console.log(`👤 [Approval Workflow] Requesting user approval: ${approvalRequest.id}`);
      
      // Send approval request notification
      this.sendNotification({
        id: `notification_${Date.now()}`,
        type: 'approval_granted',
        title: '🤖 Agent Needs Approval',
        message: approvalRequest.title,
        icon: approvalRequest.icon,
        color: approvalRequest.color,
        actions: [
          {
            label: approvalRequest.primary_action.label,
            action: approvalRequest.primary_action.id,
            style: 'primary'
          },
          ...approvalRequest.secondary_actions.map(action => ({
            label: action.label,
            action: action.id,
            style: 'secondary' as const
          }))
        ],
        timestamp: new Date().toISOString()
      });
    }

    // Store active request
    this.activeApprovalRequests.set(approvalRequest.id, approvalRequest);

    // Update workflow progress
    this.updateWorkflowProgress(plan, phase, approvalRequest);

    return approvalRequest;
  }

  /**
   * Handle user approval response
   */
  async handleUserResponse(response: UserApprovalResponse): Promise<ApprovalNotification> {
    console.log(`👤 [Approval Workflow] Processing user response: ${response.action_taken}`);

    const request = this.activeApprovalRequests.get(response.request_id);
    if (!request) {
      throw new Error('Approval request not found');
    }

    // Cancel auto-approval timer if exists
    this.cancelAutoApprovalTimer(response.request_id);

    // Update user preferences if requested
    if (response.remember_preference) {
      await this.updateUserPreferences(response, request);
    }

    // Process the response
    let notification: ApprovalNotification;

    switch (response.action_taken) {
      case 'approve':
        notification = {
          id: `notification_${Date.now()}`,
          type: 'approval_granted',
          title: '✅ Approved',
          message: `${request.title} - Agent will continue`,
          icon: '✅',
          color: 'green',
          auto_dismiss_in: 5,
          timestamp: new Date().toISOString()
        };
        break;

      case 'reject':
        notification = {
          id: `notification_${Date.now()}`,
          type: 'approval_denied',
          title: '❌ Rejected',
          message: `${request.title} - Workflow paused`,
          icon: '❌',
          color: 'red',
          actions: [{
            label: 'Resume Workflow',
            action: 'resume_workflow',
            style: 'primary'
          }],
          timestamp: new Date().toISOString()
        };
        break;

      case 'pause':
        notification = {
          id: `notification_${Date.now()}`,
          type: 'approval_denied',
          title: '⏸️ Paused',
          message: `Workflow paused - You can resume anytime`,
          icon: '⏸️',
          color: 'yellow',
          actions: [{
            label: 'Resume Workflow',
            action: 'resume_workflow',
            style: 'primary'
          }],
          timestamp: new Date().toISOString()
        };
        break;

      case 'modify':
        notification = {
          id: `notification_${Date.now()}`,
          type: 'escalated',
          title: '✏️ Modification Requested',
          message: `Workflow will be adjusted based on your feedback`,
          icon: '✏️',
          color: 'blue',
          auto_dismiss_in: 5,
          timestamp: new Date().toISOString()
        };
        break;

      default:
        throw new Error(`Unknown action: ${response.action_taken}`);
    }

    // Remove from active requests
    this.activeApprovalRequests.delete(response.request_id);

    // Send notification
    this.sendNotification(notification);

    console.log(`✅ [Approval Workflow] User response processed: ${response.action_taken}`);
    return notification;
  }

  /**
   * Get current workflow progress for user
   */
  getWorkflowProgress(workflowId: string): WorkflowProgress | null {
    return this.workflowProgress.get(workflowId) || null;
  }

  /**
   * Get pending approval requests for user
   */
  getPendingApprovals(userId: string): UserFriendlyApprovalRequest[] {
    return Array.from(this.activeApprovalRequests.values())
      .filter(request => request.id.includes(userId)); // Simplified user filtering
  }

  /**
   * Subscribe to approval notifications
   */
  onNotification(callback: (notification: ApprovalNotification) => void): void {
    this.notificationCallbacks.push(callback);
  }

  /**
   * Update user preferences
   */
  async updateUserPreferences(userId: string, preferences: Partial<UserPreferences>): Promise<void> {
    const currentPrefs = this.getUserPreferences(userId);
    const updatedPrefs = {
      ...currentPrefs,
      ...preferences,
      updated_at: new Date().toISOString()
    };
    
    this.userPreferences.set(userId, updatedPrefs);
    console.log(`⚙️ [Approval Workflow] User preferences updated for: ${userId}`);
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private async createUserFriendlyRequest(
    plan: AutonomousTaskPlan,
    phase: AutonomousPhase,
    governanceDecision: GovernanceDecision,
    approvalType: string,
    userPrefs: UserPreferences,
    additionalContext?: any
  ): Promise<UserFriendlyApprovalRequest> {
    
    const requestId = `approval_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Generate user-friendly title and description
    const { title, description, icon } = this.generateUserFriendlyContent(phase, approvalType, additionalContext);
    
    // Determine risk level and visual indicators
    const riskLevel = this.mapGovernanceRiskToUserRisk(governanceDecision);
    const color = this.getRiskColor(riskLevel);
    
    // Create primary and secondary actions
    const primaryAction: ApprovalAction = {
      id: 'approve',
      label: riskLevel === 'high' ? 'Approve High-Risk Action' : 'Approve',
      description: this.getApprovalDescription(riskLevel, approvalType),
      style: 'primary',
      icon: '✅',
      confirmation_required: riskLevel === 'high',
      confirmation_message: riskLevel === 'high' ? 
        'This is a high-risk action. Are you sure you want to proceed?' : undefined
    };

    const secondaryActions: ApprovalAction[] = [
      {
        id: 'pause',
        label: 'Pause Workflow',
        description: 'Pause the workflow - you can resume later',
        style: 'secondary',
        icon: '⏸️'
      },
      {
        id: 'details',
        label: 'See Details',
        description: 'View technical details and risk assessment',
        style: 'secondary',
        icon: '📋'
      }
    ];

    // Add modify option for certain types
    if (approvalType === 'plan_modification' || riskLevel === 'high') {
      secondaryActions.unshift({
        id: 'modify',
        label: 'Modify Request',
        description: 'Suggest changes to this action',
        style: 'warning',
        icon: '✏️'
      });
    }

    // Determine auto-approval settings
    const canAutoApprove = riskLevel === 'low' && this.shouldAutoApprove(approvalType, userPrefs);
    const autoApproveIn = canAutoApprove ? this.getAutoApprovalDelay(approvalType, userPrefs) : undefined;

    // Create technical details for power users
    const technicalDetails: TechnicalDetails = {
      governance_score: governanceDecision.confidence_score,
      risk_factors: governanceDecision.reasoning,
      compliance_frameworks: governanceDecision.metadata.compliance_frameworks_checked,
      tools_to_be_used: phase.tools,
      resource_impact: {
        estimated_cost: 0, // Would be calculated from plan
        estimated_duration: phase.estimatedDuration,
        tools_count: phase.tools.length
      },
      precedent_info: governanceDecision.metadata.precedents_referenced.length > 0 ?
        'Similar actions have been approved in the past' : undefined
    };

    return {
      id: requestId,
      type: approvalType as any,
      title,
      description,
      risk_level: riskLevel,
      estimated_time: this.formatDuration(phase.estimatedDuration),
      icon,
      color,
      progress_context: `Step ${phase.id} of ${plan.phases.length} in your workflow`,
      primary_action: primaryAction,
      secondary_actions: secondaryActions,
      technical_details: userPrefs.show_technical_details ? technicalDetails : undefined,
      auto_approve_in: autoApproveIn,
      can_be_auto_approved: canAutoApprove,
      user_preference_hint: this.getUserPreferenceHint(approvalType, userPrefs),
      timestamp: new Date().toISOString(),
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
    };
  }

  private generateUserFriendlyContent(
    phase: AutonomousPhase, 
    approvalType: string, 
    additionalContext?: any
  ): { title: string; description: string; icon: string } {
    
    // Map phase titles to user-friendly descriptions
    const phaseDescriptions: { [key: string]: { description: string; icon: string } } = {
      'research': { 
        description: 'The agent will search for information and gather relevant data',
        icon: '🔍'
      },
      'analysis': { 
        description: 'The agent will analyze data and create insights',
        icon: '📊'
      },
      'content creation': { 
        description: 'The agent will create documents, reports, or other content',
        icon: '✍️'
      },
      'data processing': { 
        description: 'The agent will process and organize data',
        icon: '⚙️'
      },
      'planning': { 
        description: 'The agent will create plans and strategies',
        icon: '📋'
      },
      'implementation': { 
        description: 'The agent will execute the planned work',
        icon: '🚀'
      },
      'review': { 
        description: 'The agent will review and validate results',
        icon: '✅'
      }
    };

    // Determine phase category
    const phaseCategory = this.categorizePhase(phase);
    const phaseInfo = phaseDescriptions[phaseCategory] || { 
      description: 'The agent will perform the next step in your workflow',
      icon: '🤖'
    };

    // Generate title based on approval type
    let title: string;
    switch (approvalType) {
      case 'phase_approval':
        title = `Agent wants to start: ${phase.title}`;
        break;
      case 'tool_approval':
        title = `Agent wants to use: ${additionalContext?.toolName || 'a tool'}`;
        break;
      case 'plan_modification':
        title = `Agent suggests modifying the plan`;
        break;
      case 'high_risk_action':
        title = `⚠️ High-risk action requires approval`;
        break;
      default:
        title = `Agent needs approval for: ${phase.title}`;
    }

    return {
      title,
      description: phaseInfo.description,
      icon: phaseInfo.icon
    };
  }

  private categorizePhase(phase: AutonomousPhase): string {
    const title = phase.title.toLowerCase();
    const tools = phase.tools.join(' ').toLowerCase();
    
    if (title.includes('research') || title.includes('search') || tools.includes('search')) {
      return 'research';
    } else if (title.includes('analysis') || title.includes('analyze') || tools.includes('analysis')) {
      return 'analysis';
    } else if (title.includes('content') || title.includes('write') || title.includes('create')) {
      return 'content creation';
    } else if (title.includes('data') || title.includes('process') || tools.includes('data')) {
      return 'data processing';
    } else if (title.includes('plan') || title.includes('strategy')) {
      return 'planning';
    } else if (title.includes('implement') || title.includes('execute') || title.includes('build')) {
      return 'implementation';
    } else if (title.includes('review') || title.includes('validate') || title.includes('check')) {
      return 'review';
    } else {
      return 'general';
    }
  }

  private mapGovernanceRiskToUserRisk(decision: GovernanceDecision): 'low' | 'medium' | 'high' {
    if (decision.decision_type === 'reject') return 'high';
    if (decision.decision_type === 'escalate') return 'high';
    if (decision.decision_type === 'conditional_approve') return 'medium';
    if (decision.confidence_score < 0.7) return 'medium';
    return 'low';
  }

  private getRiskColor(riskLevel: 'low' | 'medium' | 'high'): 'green' | 'yellow' | 'red' {
    switch (riskLevel) {
      case 'low': return 'green';
      case 'medium': return 'yellow';
      case 'high': return 'red';
    }
  }

  private getApprovalDescription(riskLevel: 'low' | 'medium' | 'high', approvalType: string): string {
    if (riskLevel === 'high') {
      return 'Carefully review this high-risk action before approving';
    } else if (riskLevel === 'medium') {
      return 'This action has some risk - review and approve if acceptable';
    } else {
      return 'This is a low-risk action that should be safe to approve';
    }
  }

  private canAutoApprove(
    request: UserFriendlyApprovalRequest, 
    decision: GovernanceDecision, 
    userPrefs: UserPreferences
  ): boolean {
    // Never auto-approve high-risk actions
    if (request.risk_level === 'high') return false;
    
    // Check if user has auto-approval enabled for this type
    if (!userPrefs.auto_approve_low_risk && request.risk_level === 'low') return false;
    
    // Check specific preferences
    if (request.type === 'tool_approval' && request.description.includes('data') && !userPrefs.auto_approve_data_analysis) {
      return false;
    }
    
    // Check governance decision
    if (decision.decision_type !== 'approve') return false;
    if (decision.confidence_score < 0.8) return false;
    
    return true;
  }

  private shouldAutoApprove(approvalType: string, userPrefs: UserPreferences): boolean {
    switch (approvalType) {
      case 'phase_approval':
        return userPrefs.auto_approve_low_risk;
      case 'tool_approval':
        return userPrefs.auto_approve_low_risk;
      default:
        return false;
    }
  }

  private getAutoApprovalDelay(approvalType: string, userPrefs: UserPreferences): number {
    // Return delay in seconds
    switch (approvalType) {
      case 'phase_approval':
        return 10; // 10 seconds for phase approvals
      case 'tool_approval':
        return 5;  // 5 seconds for tool approvals
      default:
        return 15;
    }
  }

  private getUserPreferenceHint(approvalType: string, userPrefs: UserPreferences): string | undefined {
    if (approvalType === 'tool_approval' && userPrefs.auto_approve_data_analysis) {
      return 'You usually approve data analysis tasks';
    }
    if (approvalType === 'phase_approval' && userPrefs.auto_approve_low_risk) {
      return 'You usually approve low-risk workflow steps';
    }
    return undefined;
  }

  private formatDuration(minutes: number): string {
    if (minutes < 60) {
      return `About ${minutes} minutes`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      if (remainingMinutes === 0) {
        return `About ${hours} hour${hours > 1 ? 's' : ''}`;
      } else {
        return `About ${hours}h ${remainingMinutes}m`;
      }
    }
  }

  private setAutoApprovalTimer(request: UserFriendlyApprovalRequest): void {
    if (!request.auto_approve_in) return;
    
    const timer = setTimeout(() => {
      console.log(`⚡ [Approval Workflow] Auto-approving request: ${request.id}`);
      
      // Simulate auto-approval
      this.handleUserResponse({
        request_id: request.id,
        action_taken: 'approve',
        timestamp: new Date().toISOString()
      });
    }, request.auto_approve_in * 1000);
    
    this.autoApprovalTimers.set(request.id, timer);
  }

  private cancelAutoApprovalTimer(requestId: string): void {
    const timer = this.autoApprovalTimers.get(requestId);
    if (timer) {
      clearTimeout(timer);
      this.autoApprovalTimers.delete(requestId);
      console.log(`⏹️ [Approval Workflow] Auto-approval timer cancelled: ${requestId}`);
    }
  }

  private sendNotification(notification: ApprovalNotification): void {
    console.log(`🔔 [Approval Workflow] Sending notification: ${notification.title}`);
    
    // Send to all registered callbacks
    this.notificationCallbacks.forEach(callback => {
      try {
        callback(notification);
      } catch (error) {
        console.error('Error in notification callback:', error);
      }
    });
  }

  private updateWorkflowProgress(
    plan: AutonomousTaskPlan, 
    currentPhase: AutonomousPhase, 
    approvalRequest: UserFriendlyApprovalRequest
  ): void {
    const progress: WorkflowProgress = {
      workflow_id: plan.id,
      current_phase: currentPhase.id,
      total_phases: plan.phases.length,
      phase_title: currentPhase.title,
      overall_progress: (currentPhase.id / plan.phases.length) * 100,
      estimated_completion: new Date(Date.now() + plan.estimatedDuration * 60000).toISOString(),
      status_message: `Waiting for approval: ${currentPhase.title}`,
      next_milestone: `${currentPhase.title} will complete in ${this.formatDuration(currentPhase.estimatedDuration)}`,
      progress_color: 'yellow', // Waiting for approval
      status_icon: '⏳',
      recent_activities: [
        {
          timestamp: new Date().toISOString(),
          activity: 'Requested approval',
          result: `Waiting for user approval for ${currentPhase.title}`,
          icon: '⏳'
        }
      ],
      pending_approvals: [approvalRequest],
      last_updated: new Date().toISOString()
    };
    
    this.workflowProgress.set(plan.id, progress);
  }

  private getUserPreferences(userId: string): UserPreferences {
    return this.userPreferences.get(userId) || this.getDefaultPreferences(userId);
  }

  private getDefaultPreferences(userId: string): UserPreferences {
    return {
      user_id: userId,
      auto_approve_low_risk: true,
      auto_approve_data_analysis: true,
      auto_approve_content_creation: true,
      auto_approve_research_tasks: true,
      notification_style: 'standard',
      show_technical_details: false,
      notification_channels: ['in_app'],
      preferred_approval_timeout: 30,
      pause_on_high_risk: true,
      require_confirmation_for_costs_over: 10,
      learn_from_approvals: true,
      suggest_workflow_improvements: true,
      updated_at: new Date().toISOString()
    };
  }

  private async updateUserPreferences(response: UserApprovalResponse, request: UserFriendlyApprovalRequest): Promise<void> {
    // Learn from user behavior
    const userId = 'current_user'; // Would be extracted from response context
    const currentPrefs = this.getUserPreferences(userId);
    
    // Update preferences based on user action
    if (response.action_taken === 'approve' && request.risk_level === 'low') {
      // User approved a low-risk action, reinforce auto-approval preference
      currentPrefs.auto_approve_low_risk = true;
      
      // Learn specific task preferences
      if (request.description.includes('data')) {
        currentPrefs.auto_approve_data_analysis = true;
      }
      if (request.description.includes('content') || request.description.includes('write')) {
        currentPrefs.auto_approve_content_creation = true;
      }
      if (request.description.includes('research') || request.description.includes('search')) {
        currentPrefs.auto_approve_research_tasks = true;
      }
    }
    
    this.userPreferences.set(userId, {
      ...currentPrefs,
      updated_at: new Date().toISOString()
    });
    
    console.log(`🧠 [Approval Workflow] Learned from user behavior: ${response.action_taken}`);
  }

  private convertToGovernanceContext(autonomousContext: AutonomousGovernanceContext): any {
    // Convert autonomous governance context to enhanced governance context
    return {
      request_id: `request_${Date.now()}`,
      timestamp: new Date().toISOString(),
      user_context: {
        user_id: autonomousContext.userId,
        role: 'user',
        permissions: ['standard'],
        trust_score: 0.8,
        historical_compliance: 0.9
      },
      agent_context: {
        agent_id: autonomousContext.agentId,
        agent_type: 'autonomous',
        capabilities: ['research', 'analysis', 'content_creation'],
        trust_score: 0.85,
        historical_performance: 0.9
      },
      operational_context: {
        environment: 'production',
        time_of_day: new Date().toISOString(),
        system_load: 0.3,
        concurrent_operations: 1
      },
      business_context: {
        business_impact: 'medium',
        stakeholders: [autonomousContext.userId],
        deadline_pressure: 0.3,
        cost_sensitivity: 0.5
      }
    };
  }

  private initializeDefaultPreferences(): void {
    // Initialize with sensible defaults for new users
    console.log('⚙️ [Approval Workflow] Initializing default user preferences');
  }
}

// Export singleton instance
export const autonomousApprovalWorkflow = AutonomousApprovalWorkflow.getInstance();

