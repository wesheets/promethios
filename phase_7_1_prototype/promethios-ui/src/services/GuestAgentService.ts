/**
 * GuestAgentService - Supervised AI agent access for team collaboration
 * 
 * Enables team members to interact with each other's AI agents under controlled,
 * supervised conditions. The agent owner maintains full control and approval
 * authority over guest interactions.
 * 
 * Features:
 * - Guest session management with owner approval
 * - Supervised agent interactions with real-time owner notifications
 * - Granular permission system for guest access
 * - Session recording and audit trails
 * - Owner intervention and session control
 * - Multi-level approval workflows
 * - Enterprise compliance and governance integration
 */

import { UnifiedStorageService } from './UnifiedStorageService';
import { OrganizationManagementService } from './OrganizationManagementService';
import HumanChatService from './HumanChatService';
import { UniversalGovernanceAdapter } from './UniversalGovernanceAdapter';

export interface GuestSession {
  id: string;
  hostUserId: string; // Agent owner
  hostUserName: string;
  guestUserId: string; // Guest user
  guestUserName: string;
  agentId: string;
  agentName: string;
  orgId: string;
  status: 'pending' | 'active' | 'paused' | 'completed' | 'rejected' | 'expired';
  purpose: string;
  requestMessage?: string;
  permissions: GuestPermission[];
  settings: GuestSessionSettings;
  createdAt: Date;
  startedAt?: Date;
  endedAt?: Date;
  lastActivity: Date;
  metadata: GuestSessionMetadata;
}

export interface GuestPermission {
  action: 'chat_with_agent' | 'view_repositories' | 'create_repositories' | 'edit_repositories' | 
          'use_tools' | 'share_receipts' | 'access_memory' | 'view_analytics' | 'export_data';
  granted: boolean;
  grantedBy: string;
  grantedAt: Date;
  restrictions?: PermissionRestriction[];
}

export interface PermissionRestriction {
  type: 'time_limit' | 'usage_limit' | 'scope_limit' | 'tool_restriction';
  value: any;
  description: string;
}

export interface GuestSessionSettings {
  maxDuration: number; // minutes
  requireApprovalForTools: boolean;
  allowRepositoryAccess: boolean;
  allowMemoryAccess: boolean;
  recordSession: boolean;
  notifyOwnerOnActivity: boolean;
  autoEndOnInactivity: number; // minutes
  allowedTools: string[];
  restrictedTopics: string[];
}

export interface GuestSessionMetadata {
  totalMessages: number;
  toolsUsed: string[];
  repositoriesAccessed: string[];
  receiptsShared: number;
  ownerInterventions: number;
  complianceFlags: ComplianceFlag[];
  performanceMetrics: SessionPerformanceMetrics;
}

export interface ComplianceFlag {
  id: string;
  type: 'policy_violation' | 'security_concern' | 'usage_anomaly' | 'approval_required';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  flaggedAt: Date;
  resolvedAt?: Date;
  resolvedBy?: string;
  resolution?: string;
}

export interface SessionPerformanceMetrics {
  averageResponseTime: number;
  successfulInteractions: number;
  failedInteractions: number;
  userSatisfactionScore?: number;
  ownerSatisfactionScore?: number;
}

export interface GuestMessage {
  id: string;
  sessionId: string;
  senderId: string;
  senderName: string;
  senderType: 'guest' | 'agent' | 'owner' | 'system';
  content: string;
  type: 'text' | 'tool_request' | 'tool_response' | 'approval_request' | 'system_notification';
  timestamp: Date;
  metadata: GuestMessageMetadata;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: Date;
}

export interface GuestMessageMetadata {
  toolsRequested?: string[];
  repositoriesAccessed?: string[];
  complianceChecked: boolean;
  riskScore?: number;
  requiresApproval: boolean;
  ownerNotified: boolean;
}

export interface GuestSessionRequest {
  guestUserId: string;
  guestUserName: string;
  agentId: string;
  purpose: string;
  requestMessage: string;
  requestedPermissions: string[];
  estimatedDuration: number; // minutes
  urgency: 'low' | 'medium' | 'high';
}

export interface OwnerApprovalDecision {
  sessionId: string;
  decision: 'approve' | 'reject' | 'modify';
  permissions?: GuestPermission[];
  settings?: Partial<GuestSessionSettings>;
  message?: string;
  conditions?: string[];
}

export class GuestAgentService {
  private static instance: GuestAgentService;
  private storageService: UnifiedStorageService;
  private orgService: OrganizationManagementService;
  private chatService: HumanChatService;
  private governanceAdapter: UniversalGovernanceAdapter;
  
  private activeSessions: Map<string, GuestSession> = new Map();
  private sessionMessages: Map<string, GuestMessage[]> = new Map();
  private pendingApprovals: Map<string, GuestMessage[]> = new Map();
  
  // Event listeners
  private sessionEventListeners: Map<string, ((event: GuestSessionEvent) => void)[]> = new Map();
  private messageEventListeners: Map<string, ((message: GuestMessage) => void)[]> = new Map();

  private constructor() {
    this.storageService = UnifiedStorageService.getInstance();
    this.orgService = OrganizationManagementService.getInstance();
    this.chatService = HumanChatService.getInstance();
    this.governanceAdapter = UniversalGovernanceAdapter.getInstance();
    
    this.initializeService();
  }

  public static getInstance(): GuestAgentService {
    if (!GuestAgentService.instance) {
      GuestAgentService.instance = new GuestAgentService();
    }
    return GuestAgentService.instance;
  }

  private async initializeService(): Promise<void> {
    try {
      // Load active sessions from storage
      await this.loadActiveSessions();
      
      // Set up periodic cleanup
      setInterval(() => this.cleanupExpiredSessions(), 5 * 60 * 1000); // Every 5 minutes
      
      // Set up compliance monitoring
      setInterval(() => this.monitorSessionCompliance(), 2 * 60 * 1000); // Every 2 minutes
      
      console.log('GuestAgentService initialized successfully');
    } catch (error) {
      console.error('Failed to initialize GuestAgentService:', error);
    }
  }

  // =====================================
  // SESSION MANAGEMENT
  // =====================================

  public async requestGuestSession(request: GuestSessionRequest): Promise<string> {
    try {
      // Validate request
      await this.validateSessionRequest(request);
      
      // Create session
      const session: GuestSession = {
        id: this.generateSessionId(),
        hostUserId: await this.getAgentOwner(request.agentId),
        hostUserName: await this.getAgentOwnerName(request.agentId),
        guestUserId: request.guestUserId,
        guestUserName: request.guestUserName,
        agentId: request.agentId,
        agentName: await this.getAgentName(request.agentId),
        orgId: await this.getAgentOrganization(request.agentId),
        status: 'pending',
        purpose: request.purpose,
        requestMessage: request.requestMessage,
        permissions: this.createDefaultPermissions(request.requestedPermissions),
        settings: this.createDefaultSettings(request.estimatedDuration),
        createdAt: new Date(),
        lastActivity: new Date(),
        metadata: this.createDefaultMetadata()
      };
      
      // Store session
      await this.storageService.set('guest_sessions', session.id, session);
      this.activeSessions.set(session.id, session);
      
      // Notify owner
      await this.notifyOwnerOfRequest(session);
      
      // Log event
      await this.logSessionEvent(session.id, 'session_requested', {
        guestUser: request.guestUserName,
        purpose: request.purpose,
        urgency: request.urgency
      });
      
      return session.id;
    } catch (error) {
      console.error('Failed to request guest session:', error);
      throw error;
    }
  }

  public async approveGuestSession(decision: OwnerApprovalDecision): Promise<void> {
    try {
      const session = this.activeSessions.get(decision.sessionId);
      if (!session) {
        throw new Error('Session not found');
      }
      
      if (decision.decision === 'approve') {
        // Update session with approved permissions and settings
        session.status = 'active';
        session.startedAt = new Date();
        session.lastActivity = new Date();
        
        if (decision.permissions) {
          session.permissions = decision.permissions;
        }
        
        if (decision.settings) {
          session.settings = { ...session.settings, ...decision.settings };
        }
        
        // Set up session monitoring
        this.setupSessionMonitoring(session.id);
        
        // Notify guest
        await this.notifyGuestOfApproval(session, decision.message);
        
        // Log event
        await this.logSessionEvent(session.id, 'session_approved', {
          approvedBy: session.hostUserName,
          conditions: decision.conditions
        });
        
      } else if (decision.decision === 'reject') {
        session.status = 'rejected';
        session.endedAt = new Date();
        
        // Notify guest
        await this.notifyGuestOfRejection(session, decision.message);
        
        // Log event
        await this.logSessionEvent(session.id, 'session_rejected', {
          rejectedBy: session.hostUserName,
          reason: decision.message
        });
      }
      
      // Update storage
      await this.storageService.set('guest_sessions', session.id, session);
      
      // Emit event
      this.emitSessionEvent(session.id, {
        type: decision.decision === 'approve' ? 'session_started' : 'session_rejected',
        sessionId: session.id,
        timestamp: new Date(),
        data: decision
      });
      
    } catch (error) {
      console.error('Failed to approve guest session:', error);
      throw error;
    }
  }

  public async endGuestSession(sessionId: string, reason: string = 'completed'): Promise<void> {
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }
      
      session.status = 'completed';
      session.endedAt = new Date();
      
      // Clean up monitoring
      this.cleanupSessionMonitoring(sessionId);
      
      // Generate session summary
      const summary = await this.generateSessionSummary(session);
      
      // Notify participants
      await this.notifySessionEnd(session, reason, summary);
      
      // Archive session
      await this.archiveSession(session);
      
      // Log event
      await this.logSessionEvent(sessionId, 'session_ended', {
        reason,
        duration: session.endedAt.getTime() - (session.startedAt?.getTime() || session.createdAt.getTime()),
        summary
      });
      
      // Remove from active sessions
      this.activeSessions.delete(sessionId);
      this.sessionMessages.delete(sessionId);
      this.pendingApprovals.delete(sessionId);
      
      // Emit event
      this.emitSessionEvent(sessionId, {
        type: 'session_ended',
        sessionId,
        timestamp: new Date(),
        data: { reason, summary }
      });
      
    } catch (error) {
      console.error('Failed to end guest session:', error);
      throw error;
    }
  }

  // =====================================
  // MESSAGE HANDLING
  // =====================================

  public async sendGuestMessage(sessionId: string, senderId: string, content: string, type: GuestMessage['type'] = 'text'): Promise<string> {
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session || session.status !== 'active') {
        throw new Error('Session not active');
      }
      
      // Create message
      const message: GuestMessage = {
        id: this.generateMessageId(),
        sessionId,
        senderId,
        senderName: await this.getUserName(senderId),
        senderType: this.getSenderType(senderId, session),
        content,
        type,
        timestamp: new Date(),
        metadata: await this.createMessageMetadata(content, session),
        approvalStatus: this.requiresApproval(content, session) ? 'pending' : undefined
      };
      
      // Store message
      if (!this.sessionMessages.has(sessionId)) {
        this.sessionMessages.set(sessionId, []);
      }
      this.sessionMessages.get(sessionId)!.push(message);
      
      // Handle approval if required
      if (message.approvalStatus === 'pending') {
        await this.handleApprovalRequest(message, session);
      } else {
        // Process message immediately
        await this.processGuestMessage(message, session);
      }
      
      // Update session activity
      session.lastActivity = new Date();
      session.metadata.totalMessages++;
      
      // Store updates
      await this.storageService.set('guest_sessions', sessionId, session);
      await this.storageService.set('guest_messages', sessionId, this.sessionMessages.get(sessionId));
      
      // Emit event
      this.emitMessageEvent(sessionId, message);
      
      return message.id;
    } catch (error) {
      console.error('Failed to send guest message:', error);
      throw error;
    }
  }

  public async approveMessage(messageId: string, sessionId: string, approverId: string): Promise<void> {
    try {
      const messages = this.sessionMessages.get(sessionId);
      const message = messages?.find(m => m.id === messageId);
      
      if (!message) {
        throw new Error('Message not found');
      }
      
      message.approvalStatus = 'approved';
      message.approvedBy = approverId;
      message.approvedAt = new Date();
      
      // Process the approved message
      const session = this.activeSessions.get(sessionId);
      if (session) {
        await this.processGuestMessage(message, session);
      }
      
      // Update storage
      await this.storageService.set('guest_messages', sessionId, messages);
      
      // Remove from pending approvals
      const pending = this.pendingApprovals.get(sessionId) || [];
      const updatedPending = pending.filter(m => m.id !== messageId);
      this.pendingApprovals.set(sessionId, updatedPending);
      
      // Emit event
      this.emitMessageEvent(sessionId, message);
      
    } catch (error) {
      console.error('Failed to approve message:', error);
      throw error;
    }
  }

  // =====================================
  // SESSION MONITORING
  // =====================================

  private setupSessionMonitoring(sessionId: string): void {
    // Set up inactivity monitoring
    const checkInactivity = () => {
      const session = this.activeSessions.get(sessionId);
      if (!session) return;
      
      const inactiveTime = Date.now() - session.lastActivity.getTime();
      const maxInactivity = session.settings.autoEndOnInactivity * 60 * 1000;
      
      if (inactiveTime > maxInactivity) {
        this.endGuestSession(sessionId, 'inactivity_timeout');
      }
    };
    
    const inactivityInterval = setInterval(checkInactivity, 60 * 1000); // Check every minute
    
    // Store interval for cleanup
    (this as any)[`inactivity_${sessionId}`] = inactivityInterval;
  }

  private cleanupSessionMonitoring(sessionId: string): void {
    const interval = (this as any)[`inactivity_${sessionId}`];
    if (interval) {
      clearInterval(interval);
      delete (this as any)[`inactivity_${sessionId}`];
    }
  }

  private async monitorSessionCompliance(): Promise<void> {
    for (const [sessionId, session] of this.activeSessions) {
      if (session.status !== 'active') continue;
      
      try {
        // Check for compliance violations
        const violations = await this.checkSessionCompliance(session);
        
        if (violations.length > 0) {
          // Handle violations
          await this.handleComplianceViolations(session, violations);
        }
        
        // Check session duration
        if (session.startedAt) {
          const duration = Date.now() - session.startedAt.getTime();
          const maxDuration = session.settings.maxDuration * 60 * 1000;
          
          if (duration > maxDuration) {
            await this.endGuestSession(sessionId, 'duration_exceeded');
          }
        }
        
      } catch (error) {
        console.error(`Failed to monitor session ${sessionId}:`, error);
      }
    }
  }

  // =====================================
  // UTILITY METHODS
  // =====================================

  private generateSessionId(): string {
    return `guest_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateMessageId(): string {
    return `guest_msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async validateSessionRequest(request: GuestSessionRequest): Promise<void> {
    // Validate agent exists and is accessible
    const agentOwner = await this.getAgentOwner(request.agentId);
    if (!agentOwner) {
      throw new Error('Agent not found or not accessible');
    }
    
    // Check if guest user has permission to request access
    const hasPermission = await this.orgService.checkUserPermission(
      request.guestUserId,
      'request_guest_access'
    );
    
    if (!hasPermission) {
      throw new Error('User does not have permission to request guest access');
    }
    
    // Check for existing active sessions
    const existingSessions = Array.from(this.activeSessions.values())
      .filter(s => s.guestUserId === request.guestUserId && 
                   s.agentId === request.agentId && 
                   ['pending', 'active'].includes(s.status));
    
    if (existingSessions.length > 0) {
      throw new Error('User already has an active or pending session with this agent');
    }
  }

  private createDefaultPermissions(requestedPermissions: string[]): GuestPermission[] {
    const defaultPermissions: GuestPermission[] = [];
    
    for (const permission of requestedPermissions) {
      defaultPermissions.push({
        action: permission as GuestPermission['action'],
        granted: false, // Requires owner approval
        grantedBy: '',
        grantedAt: new Date()
      });
    }
    
    return defaultPermissions;
  }

  private createDefaultSettings(estimatedDuration: number): GuestSessionSettings {
    return {
      maxDuration: Math.max(estimatedDuration, 60), // At least 1 hour
      requireApprovalForTools: true,
      allowRepositoryAccess: false,
      allowMemoryAccess: false,
      recordSession: true,
      notifyOwnerOnActivity: true,
      autoEndOnInactivity: 30, // 30 minutes
      allowedTools: [],
      restrictedTopics: []
    };
  }

  private createDefaultMetadata(): GuestSessionMetadata {
    return {
      totalMessages: 0,
      toolsUsed: [],
      repositoriesAccessed: [],
      receiptsShared: 0,
      ownerInterventions: 0,
      complianceFlags: [],
      performanceMetrics: {
        averageResponseTime: 0,
        successfulInteractions: 0,
        failedInteractions: 0
      }
    };
  }

  private async getAgentOwner(agentId: string): Promise<string> {
    // Implementation would get agent owner from agent service
    return 'owner_user_id'; // Placeholder
  }

  private async getAgentOwnerName(agentId: string): Promise<string> {
    // Implementation would get agent owner name
    return 'Agent Owner'; // Placeholder
  }

  private async getAgentName(agentId: string): Promise<string> {
    // Implementation would get agent name
    return 'AI Agent'; // Placeholder
  }

  private async getAgentOrganization(agentId: string): Promise<string> {
    // Implementation would get agent organization
    return 'default_org'; // Placeholder
  }

  private async getUserName(userId: string): Promise<string> {
    // Implementation would get user name
    return 'User'; // Placeholder
  }

  private getSenderType(senderId: string, session: GuestSession): GuestMessage['senderType'] {
    if (senderId === session.hostUserId) return 'owner';
    if (senderId === session.guestUserId) return 'guest';
    if (senderId === session.agentId) return 'agent';
    return 'system';
  }

  private async createMessageMetadata(content: string, session: GuestSession): Promise<GuestMessageMetadata> {
    return {
      complianceChecked: false,
      requiresApproval: this.requiresApproval(content, session),
      ownerNotified: false
    };
  }

  private requiresApproval(content: string, session: GuestSession): boolean {
    // Check if message requires approval based on content and settings
    if (session.settings.requireApprovalForTools && this.containsToolRequest(content)) {
      return true;
    }
    
    // Check for restricted topics
    for (const topic of session.settings.restrictedTopics) {
      if (content.toLowerCase().includes(topic.toLowerCase())) {
        return true;
      }
    }
    
    return false;
  }

  private containsToolRequest(content: string): boolean {
    // Simple check for tool requests - would be more sophisticated in real implementation
    const toolKeywords = ['execute', 'run', 'create file', 'delete', 'install', 'deploy'];
    return toolKeywords.some(keyword => content.toLowerCase().includes(keyword));
  }

  private async handleApprovalRequest(message: GuestMessage, session: GuestSession): Promise<void> {
    // Add to pending approvals
    if (!this.pendingApprovals.has(session.id)) {
      this.pendingApprovals.set(session.id, []);
    }
    this.pendingApprovals.get(session.id)!.push(message);
    
    // Notify owner
    await this.notifyOwnerOfApprovalRequest(message, session);
  }

  private async processGuestMessage(message: GuestMessage, session: GuestSession): Promise<void> {
    // Process the message (send to agent, etc.)
    // This would integrate with the actual agent service
    console.log(`Processing guest message: ${message.content}`);
  }

  private async notifyOwnerOfRequest(session: GuestSession): Promise<void> {
    // Send notification to agent owner about guest access request
    await this.chatService.sendSystemMessage(
      session.hostUserId,
      `Guest access request from ${session.guestUserName} for agent ${session.agentName}. Purpose: ${session.purpose}`
    );
  }

  private async notifyGuestOfApproval(session: GuestSession, message?: string): Promise<void> {
    // Notify guest that their request was approved
    await this.chatService.sendSystemMessage(
      session.guestUserId,
      `Your guest access request for agent ${session.agentName} has been approved. ${message || ''}`
    );
  }

  private async notifyGuestOfRejection(session: GuestSession, message?: string): Promise<void> {
    // Notify guest that their request was rejected
    await this.chatService.sendSystemMessage(
      session.guestUserId,
      `Your guest access request for agent ${session.agentName} has been rejected. ${message || ''}`
    );
  }

  private async notifyOwnerOfApprovalRequest(message: GuestMessage, session: GuestSession): Promise<void> {
    // Notify owner that a message requires approval
    await this.chatService.sendSystemMessage(
      session.hostUserId,
      `Guest ${session.guestUserName} sent a message requiring approval: "${message.content}"`
    );
  }

  private async notifySessionEnd(session: GuestSession, reason: string, summary: any): Promise<void> {
    // Notify both parties that the session has ended
    const endMessage = `Guest session with agent ${session.agentName} has ended. Reason: ${reason}`;
    
    await this.chatService.sendSystemMessage(session.hostUserId, endMessage);
    await this.chatService.sendSystemMessage(session.guestUserId, endMessage);
  }

  private async generateSessionSummary(session: GuestSession): Promise<any> {
    const messages = this.sessionMessages.get(session.id) || [];
    
    return {
      duration: session.endedAt ? session.endedAt.getTime() - (session.startedAt?.getTime() || session.createdAt.getTime()) : 0,
      totalMessages: messages.length,
      toolsUsed: session.metadata.toolsUsed,
      complianceFlags: session.metadata.complianceFlags.length,
      performanceMetrics: session.metadata.performanceMetrics
    };
  }

  private async archiveSession(session: GuestSession): Promise<void> {
    // Archive session data for long-term storage
    await this.storageService.set('archived_guest_sessions', session.id, {
      session,
      messages: this.sessionMessages.get(session.id) || []
    });
  }

  private async checkSessionCompliance(session: GuestSession): Promise<ComplianceFlag[]> {
    // Check for compliance violations
    const violations: ComplianceFlag[] = [];
    
    // This would integrate with governance systems
    // For now, return empty array
    
    return violations;
  }

  private async handleComplianceViolations(session: GuestSession, violations: ComplianceFlag[]): Promise<void> {
    // Handle compliance violations
    for (const violation of violations) {
      session.metadata.complianceFlags.push(violation);
      
      if (violation.severity === 'critical') {
        // End session immediately for critical violations
        await this.endGuestSession(session.id, 'compliance_violation');
        break;
      }
    }
  }

  private async loadActiveSessions(): Promise<void> {
    // Load active sessions from storage
    try {
      // Use keys() method to get all keys from guest_sessions namespace
      const sessionKeys = await this.storageService.keys('guest_sessions');
      
      for (const key of sessionKeys) {
        // Keys from UnifiedStorageService don't include namespace prefix
        const session = await this.storageService.get<GuestSession>('guest_sessions', key);
        if (session && ['pending', 'active'].includes(session.status)) {
          this.activeSessions.set(session.id, session);
          
          // Load messages - use get() method
          const messages = await this.storageService.get<GuestMessage[]>('guest_messages', session.id);
          if (messages) {
            this.sessionMessages.set(session.id, messages);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load active sessions:', error);
    }
  }

  private async cleanupExpiredSessions(): Promise<void> {
    const now = Date.now();
    
    for (const [sessionId, session] of this.activeSessions) {
      // Check for expired pending sessions (24 hours)
      if (session.status === 'pending') {
        const age = now - session.createdAt.getTime();
        if (age > 24 * 60 * 60 * 1000) { // 24 hours
          await this.endGuestSession(sessionId, 'expired');
        }
      }
    }
  }

  private async logSessionEvent(sessionId: string, eventType: string, data: any): Promise<void> {
    // Log session events for audit trail
    const logEntry = {
      sessionId,
      eventType,
      timestamp: new Date(),
      data
    };
    
    const logKey = `${sessionId}_${Date.now()}`;
    await this.storageService.set('guest_session_logs', logKey, logEntry);
  }

  // =====================================
  // EVENT SYSTEM
  // =====================================

  public onSessionEvent(sessionId: string, callback: (event: GuestSessionEvent) => void): void {
    if (!this.sessionEventListeners.has(sessionId)) {
      this.sessionEventListeners.set(sessionId, []);
    }
    this.sessionEventListeners.get(sessionId)!.push(callback);
  }

  public onMessageEvent(sessionId: string, callback: (message: GuestMessage) => void): void {
    if (!this.messageEventListeners.has(sessionId)) {
      this.messageEventListeners.set(sessionId, []);
    }
    this.messageEventListeners.get(sessionId)!.push(callback);
  }

  private emitSessionEvent(sessionId: string, event: GuestSessionEvent): void {
    const listeners = this.sessionEventListeners.get(sessionId) || [];
    listeners.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('Error in session event listener:', error);
      }
    });
  }

  private emitMessageEvent(sessionId: string, message: GuestMessage): void {
    const listeners = this.messageEventListeners.get(sessionId) || [];
    listeners.forEach(callback => {
      try {
        callback(message);
      } catch (error) {
        console.error('Error in message event listener:', error);
      }
    });
  }

  // =====================================
  // PUBLIC API METHODS
  // =====================================

  public async getActiveSessions(userId: string): Promise<GuestSession[]> {
    return Array.from(this.activeSessions.values())
      .filter(session => session.hostUserId === userId || session.guestUserId === userId);
  }

  public async getSessionMessages(sessionId: string): Promise<GuestMessage[]> {
    return this.sessionMessages.get(sessionId) || [];
  }

  public async getPendingApprovals(userId: string): Promise<GuestMessage[]> {
    const userSessions = Array.from(this.activeSessions.values())
      .filter(session => session.hostUserId === userId);
    
    const allPending: GuestMessage[] = [];
    for (const session of userSessions) {
      const pending = this.pendingApprovals.get(session.id) || [];
      allPending.push(...pending);
    }
    
    return allPending;
  }

  public async getSessionById(sessionId: string): Promise<GuestSession | null> {
    return this.activeSessions.get(sessionId) || null;
  }

  public async pauseSession(sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (session && session.status === 'active') {
      session.status = 'paused';
      await this.storageService.set('guest_sessions', sessionId, session);
      
      this.emitSessionEvent(sessionId, {
        type: 'session_paused',
        sessionId,
        timestamp: new Date(),
        data: {}
      });
    }
  }

  public async resumeSession(sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (session && session.status === 'paused') {
      session.status = 'active';
      session.lastActivity = new Date();
      await this.storageService.set('guest_sessions', sessionId, session);
      
      this.emitSessionEvent(sessionId, {
        type: 'session_resumed',
        sessionId,
        timestamp: new Date(),
        data: {}
      });
    }
  }
}

export interface GuestSessionEvent {
  type: 'session_requested' | 'session_approved' | 'session_rejected' | 'session_started' | 
        'session_paused' | 'session_resumed' | 'session_ended' | 'compliance_violation';
  sessionId: string;
  timestamp: Date;
  data: any;
}

export default GuestAgentService;

